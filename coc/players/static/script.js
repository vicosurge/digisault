document.addEventListener("DOMContentLoaded", () => {
  // Auto-fill skill base values
  const baseSkills = {
    "spot_hidden": 25,
    "library_use": 20,
    "psychology": 10,
    "stealth": 20,
    "occult": 5,
    "firearms_handgun": 20
  };

  for (let skill in baseSkills) {
    const input = document.querySelector(`input[name="${skill}"]`);
    if (input) input.value = baseSkills[skill];
  }

  // HP Calculation (SIZ + CON) / 10 rounded down
  const hpInput = document.querySelector('input[name="hp"]');
  const conInput = document.querySelector('input[name="con"]');
  const sizInput = document.querySelector('input[name="siz"]');
  function calculateHP() {
    const con = parseInt(conInput.value || 0);
    const siz = parseInt(sizInput.value || 0);
    hpInput.value = Math.floor((con + siz) / 10);
  }
  conInput.addEventListener('input', calculateHP);
  sizInput.addEventListener('input', calculateHP);

  // Toggle sections
  document.querySelectorAll('.collapsible').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.nextElementSibling;
      section.style.display = section.style.display === 'none' ? 'block' : 'none';
    });
  });

  // Save to backend
  document.getElementById("save").addEventListener("click", async () => {
    const formData = Object.fromEntries(new FormData(document.querySelector("form")));
    const response = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    alert("Character saved!");
  });

  // Load character from dropdown
  async function loadCharacter(name) {
    const response = await fetch(`/load/${name}`);
    if (!response.ok) return alert("Failed to load character.");
    const data = await response.json();
    for (let key in data) {
      const input = document.querySelector(`[name="${key}"]`);
      if (input) input.value = data[key];
    }
    alert("Character loaded.");
  }

  document.getElementById("load").addEventListener("click", async () => {
    const name = prompt("Enter character name to load:");
    if (name) loadCharacter(name);
  });

  // Print
  document.getElementById("print").addEventListener("click", () => {
    window.print();
  });
});

