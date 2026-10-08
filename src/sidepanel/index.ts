import { getServerUrl } from '../shared/api/server';

interface ReviewCard {
  _id: string;
  sourceWord?: string;
  collocation: string;
  ipa?: string;
  meaning?: string;
  example_en?: string;
  example_vi?: string;
  synonyms?: string;
  anonyms?: string;
}

const cardElement = document.getElementById('flashcard') as HTMLElement;
const sourceElement = document.getElementById('sourceWord') as HTMLSpanElement;
const wordElement = document.getElementById('wordText') as HTMLHeadingElement;
const ipaElement = document.getElementById('ipaText') as HTMLParagraphElement;
const answerElement = document.getElementById('answerPanel') as HTMLDivElement;
const hintElement = document.getElementById('flipHint') as HTMLSpanElement;
const countElement = document.getElementById('deckCount') as HTMLParagraphElement;
const emptyElement = document.getElementById('emptyState') as HTMLDivElement;
const errorElement = document.getElementById('errorText') as HTMLParagraphElement;

let cards: ReviewCard[] = [];
let index = 0;
let revealed = false;

document.getElementById('prevBtn')!.addEventListener('click', () => move(-1));
document.getElementById('nextBtn')!.addEventListener('click', () => move(1));
document.getElementById('shuffleBtn')!.addEventListener('click', shuffle);
document.getElementById('closePanelBtn')!.addEventListener('click', () => {
  void chrome.runtime.sendMessage({ action: 'disableVocabularyPanel' });
});
document.getElementById('speakWordBtn')!.addEventListener('click', event => {
  event.stopPropagation();
  speak(cards[index]?.collocation);
});
cardElement.addEventListener('click', event => {
  if ((event.target as HTMLElement).closest('button')) return;
  flip();
});
cardElement.addEventListener('keydown', event => {
  if ((event.target as HTMLElement).closest('button')) return;
  if (event.key === 'Enter' || event.code === 'Space') {
    event.preventDefault();
    flip();
  }
});
document.addEventListener('keydown', event => {
  if (event.target instanceof HTMLElement && (event.target.closest('button') || event.target.closest('#flashcard'))) return;
  if (event.key === 'ArrowRight') move(1);
  else if (event.key === 'ArrowLeft') move(-1);
  else if (event.code === 'Space') { event.preventDefault(); flip(); }
  else if (event.key.toLowerCase() === 'r') shuffle();
});

function appendText(tag: string, className: string, value: string): HTMLElement {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = value;
  answerElement.appendChild(element);
  return element;
}

function makeSpeakButton(value: string, label: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'side-speak';
  button.type = 'button';
  button.textContent = '🔊';
  button.setAttribute('aria-label', label);
  button.addEventListener('click', event => {
    event.stopPropagation();
    speak(value);
  });
  return button;
}

function render(): void {
  const card = cards[index];
  const empty = !card;
  emptyElement.classList.toggle('hidden', !empty);
  cardElement.classList.toggle('hidden', empty);
  if (empty) {
    countElement.textContent = '0 từ trong kho lưu trữ';
    return;
  }

  sourceElement.textContent = card.sourceWord || '';
  sourceElement.classList.toggle('hidden', !card.sourceWord);
  wordElement.textContent = card.collocation;
  ipaElement.textContent = card.ipa || '';
  ipaElement.classList.toggle('hidden', !card.ipa);
  answerElement.replaceChildren();
  if (card.meaning) appendText('p', 'side-meaning', card.meaning);
  if (card.example_en) {
    const row = document.createElement('div');
    row.className = 'side-example-row';
    const example = document.createElement('p');
    example.textContent = `🇬🇧 ${card.example_en}`;
    row.append(example, makeSpeakButton(card.example_en, 'Đọc câu ví dụ'));
    answerElement.appendChild(row);
  }
  if (card.example_vi) appendText('p', 'side-example side-muted', `🇻🇳 ${card.example_vi}`);
  if (card.synonyms) appendText('p', 'side-muted', `Đồng nghĩa: ${card.synonyms}`);
  if (card.anonyms) appendText('p', 'side-muted', `Trái nghĩa: ${card.anonyms}`);
  answerElement.classList.toggle('hidden', !revealed);
  hintElement.textContent = revealed ? 'Chạm để ẩn đáp án' : 'Chạm để xem nghĩa và ví dụ';
  countElement.textContent = `${index + 1} / ${cards.length} · chỉ mục lưu trữ`;
}

function flip(): void {
  if (!cards.length) return;
  revealed = !revealed;
  answerElement.classList.toggle('hidden', !revealed);
  hintElement.textContent = revealed ? 'Chạm để ẩn đáp án' : 'Chạm để xem nghĩa và ví dụ';
}

function move(delta: number): void {
  if (!cards.length) return;
  index = (index + delta + cards.length) % cards.length;
  revealed = false;
  render();
}

function shuffleInPlace<T>(items: T[]): void {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
}

function shuffle(): void {
  if (cards.length < 2) return;
  shuffleInPlace(cards);
  index = 0;
  revealed = false;
  render();
}

function speak(value?: string): void {
  if (!value) return;
  if (!('speechSynthesis' in window)) {
    errorElement.textContent = 'Trình duyệt này chưa hỗ trợ đọc văn bản.';
    errorElement.classList.remove('hidden');
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(value);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}

async function loadCards(): Promise<void> {
  try {
    const serverUrl = await getServerUrl();
    const firstResponse = await fetch(`${serverUrl}/api/review-cards?scope=archive&page=1&limit=500`);
    if (!firstResponse.ok) throw new Error(`Server trả về HTTP ${firstResponse.status}`);
    const first = await firstResponse.json();
    cards = first.data || [];
    for (let page = 2; page <= first.totalPages; page += 1) {
      const response = await fetch(`${serverUrl}/api/review-cards?scope=archive&page=${page}&limit=500`);
      if (!response.ok) throw new Error(`Server trả về HTTP ${response.status}`);
      const next = await response.json();
      cards.push(...(next.data || []));
    }
    shuffleInPlace(cards);
    render();
  } catch (error) {
    countElement.textContent = 'Không tải được từ';
    errorElement.textContent = error instanceof Error ? error.message : 'Không kết nối được server.';
    errorElement.classList.remove('hidden');
  }
}

void loadCards();
