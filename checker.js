// ---------- Topic info ----------
const checkerTopics = {
  malaria: { title: "Malaria", icon: "🦟", link: "malaria.html" },
  typhoid: { title: "Typhoid Fever", icon: "🌡️", link: "typhoid.html" },
  diarrhoea: { title: "Diarrhoea", icon: "💧", link: "diarrhoea.html" },
  respiratory: { title: "Cough & Chest Infections", icon: "🫁", link: "respiratory.html" },
  tb: { title: "Tuberculosis (TB)", icon: "🫀", link: "tb.html" },
  hepatitis: { title: "Hepatitis B", icon: "🟡", link: "hepatitis.html" },
  pressure: { title: "High Blood Pressure", icon: "❤️", link: "pressure.html" },
  diabetes: { title: "Diabetes", icon: "🩸", link: "diabetes.html" },
  anaemia: { title: "Anaemia", icon: "💪", link: "anaemia.html" },
  skin: { title: "Skin Infections", icon: "🧴", link: "skin.html" },
  sti: { title: "STIs", icon: "🛡️", link: "sti.html" }
};

// ---------- Symptom bank: each symptom points to the topics it can suggest ----------
// Used to build both the checklist UI and the free-text keyword matcher.
const symptomBank = [
  { label: "Fever, or feeling hot then cold", keywords: ["fever", "hot and cold", "high temperature"], topics: ["malaria", "typhoid"] },
  { label: "Chills and shaking", keywords: ["chills", "shaking", "shivering"], topics: ["malaria"] },
  { label: "Recent mosquito bites", keywords: ["mosquito"], topics: ["malaria"] },
  { label: "Fever that keeps getting worse over days", keywords: ["worse over days", "prolonged fever", "days of fever"], topics: ["typhoid"] },
  { label: "Stomach pain", keywords: ["stomach pain", "tummy pain", "belly pain"], topics: ["typhoid", "diarrhoea", "hepatitis"] },
  { label: "Watery poop / diarrhoea", keywords: ["watery", "diarrhoea", "diarrhea", "running stomach"], topics: ["diarrhoea"] },
  { label: "Vomiting", keywords: ["vomit", "throwing up", "throw up"], topics: ["malaria", "typhoid", "diarrhoea", "hepatitis"] },
  { label: "Cough", keywords: ["cough", "coughing"], topics: ["respiratory", "tb"] },
  { label: "Difficulty breathing", keywords: ["breathing", "breath", "short of breath", "can't breathe"], topics: ["respiratory"] },
  { label: "Cough lasting more than 2 weeks", keywords: ["weeks of cough", "long cough", "cough for weeks"], topics: ["tb"] },
  { label: "Night sweats", keywords: ["night sweat", "sweating at night"], topics: ["tb"] },
  { label: "Losing weight without trying", keywords: ["losing weight", "weight loss", "lost weight"], topics: ["tb", "diabetes"] },
  { label: "Itchy rash or sores on skin", keywords: ["rash", "itchy skin", "itching", "sores", "ringworm", "boils"], topics: ["skin"] },
  { label: "Headache", keywords: ["headache", "head hurts", "head pain"], topics: ["malaria", "typhoid", "pressure"] },
  { label: "Dizziness", keywords: ["dizzy", "dizziness", "room spins"], topics: ["pressure", "anaemia"] },
  { label: "Chest pain", keywords: ["chest pain", "chest hurts"], topics: ["pressure", "respiratory"] },
  { label: "Very thirsty and urinating a lot", keywords: ["thirsty", "urinate a lot", "pee a lot", "peeing often"], topics: ["diabetes"] },
  { label: "Feeling weak, tired and pale", keywords: ["weak", "tired", "pale", "no energy"], topics: ["anaemia"] },
  { label: "Yellow eyes or skin", keywords: ["yellow eyes", "yellow skin", "jaundice"], topics: ["hepatitis"] },
  { label: "Pain or discomfort in private parts", keywords: ["private parts", "private area", "genital"], topics: ["sti"] }
];

// ---------- Tabs ----------
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('tab-' + this.dataset.tab).classList.add('active');
      document.getElementById('checkerResults').innerHTML = '';
    });
  });

  buildChecklist();
});

// ---------- Build checklist UI ----------
function buildChecklist() {
  const box = document.getElementById('symptomChecklist');
  box.innerHTML = symptomBank.map((s, i) => `
    <label class="symptom-item">
      <input type="checkbox" data-index="${i}">
      <span>${s.label}</span>
    </label>
  `).join('');
}

// ---------- Scoring ----------
function scoreTopics(matchedSymptomIndexes) {
  const scores = {};
  matchedSymptomIndexes.forEach(i => {
    symptomBank[i].topics.forEach(topic => {
      scores[topic] = (scores[topic] || 0) + 1;
    });
  });
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 0);
}

function renderResults(sortedScores) {
  const box = document.getElementById('checkerResults');

  if (sortedScores.length === 0) {
    box.innerHTML = `
      <div class="result-card">
        <h3>We're not sure 🤔</h3>
        <p>Your answer doesn't clearly match a topic here. The safest step is to visit the hospital so a real doctor can check you properly.</p>
        <a href="doctors.html" class="speak-btn" style="text-decoration:none; display:inline-block;">See Doctors →</a>
      </div>`;
    return;
  }

  const topScore = sortedScores[0][1];
  const topMatches = sortedScores.filter(([, score]) => score === topScore).slice(0, 3);

  let html = `<h3 style="color:var(--accent);">This may be related to:</h3>`;
  topMatches.forEach(([key]) => {
    const t = checkerTopics[key];
    html += `
      <div class="result-card">
        <h3>${t.icon} ${t.title}</h3>
        <a href="${t.link}" class="speak-btn" style="text-decoration:none; display:inline-block;">Read more →</a>
      </div>`;
  });
  html += `<p style="margin-top:16px; font-size:0.9rem;">⚠️ This is only a guide, not a diagnosis. Please see a doctor for a proper check-up.</p>`;

  box.innerHTML = html;
}

// ---------- Free text analysis ----------
function analyzeText() {
  const input = document.getElementById('symptomText').value.trim().toLowerCase();
  if (!input) {
    document.getElementById('checkerResults').innerHTML = `<p class="error-text">Please type something first.</p>`;
    return;
  }

  const matchedIndexes = [];
  symptomBank.forEach((s, i) => {
    const hit = s.keywords.some(k => input.includes(k));
    if (hit) matchedIndexes.push(i);
  });

  renderResults(scoreTopics(matchedIndexes));
}

// ---------- Checklist analysis ----------
function analyzeChecklist() {
  const checked = Array.from(document.querySelectorAll('#symptomChecklist input:checked'))
    .map(el => parseInt(el.dataset.index));

  if (checked.length === 0) {
    document.getElementById('checkerResults').innerHTML = `<p class="error-text">Please tick at least one symptom.</p>`;
    return;
  }

  renderResults(scoreTopics(checked));
}