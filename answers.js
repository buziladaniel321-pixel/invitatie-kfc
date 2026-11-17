// Pagina ta privată: ceri răspunsurile de la server cu parola ta și le arăți frumos

const form = document.getElementById("login-form");
const keyInput = document.getElementById("key-input");
const statusText = document.getElementById("status");
const list = document.getElementById("answer-list");

// „de 3 ori”, „de 20 de ori”, „o dată” — româna are reguli pentru numere
function timesText(n) {
  if (n === 1) return "o dată";
  const de = n % 100 === 0 || n % 100 >= 20 ? " de" : "";
  return `de ${n}${de} ori`;
}

function formatMoment(iso) {
  return new Date(iso).toLocaleString("ro-RO", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
}

function showAnswers(answers) {
  list.innerHTML = "";
  if (answers.length === 0) {
    statusText.textContent = "Încă n-a răspuns. Mai verifică puțin mai târziu.";
    return;
  }

  // Lista vine cu cel mai nou răspuns primul
  const chosen = answers.find((a) => a.step === "time");
  statusText.textContent = chosen
    ? `A spus DA ❤ și a ales ora ${chosen.time}.`
    : "A spus DA ❤, dar încă n-a ales ora.";

  answers.forEach((a) => {
    const item = document.createElement("li");
    const what = a.step === "time" ? `a ales ora ${a.time}` : "a apăsat „Da”";
    const tries = a.noAttempts ? ` · a încercat „Nu” ${timesText(a.noAttempts)}` : "";
    item.textContent = `${formatMoment(a.at)}: ${what}${tries}`;
    list.appendChild(item);
  });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusText.textContent = "Se încarcă…";
  try {
    const response = await fetch("/api/answer", { headers: { "x-admin-key": keyInput.value } });
    if (response.status === 401) {
      statusText.textContent = "Parolă greșită.";
      list.innerHTML = "";
      return;
    }
    const data = await response.json();
    if (!data.ok) throw new Error("server");
    // Ținem minte parola doar pe dispozitivul tău, ca să nu o scrii de fiecare dată
    try { localStorage.setItem("adminKey", keyInput.value); } catch (e) {}
    showAnswers(data.answers);
  } catch (error) {
    statusText.textContent = "Nu am putut încărca răspunsurile. Încearcă din nou.";
  }
});

// Dacă parola e deja ținută minte, arătăm direct răspunsurile
try {
  keyInput.value = localStorage.getItem("adminKey") || "";
  if (keyInput.value) form.requestSubmit();
} catch (e) {}
