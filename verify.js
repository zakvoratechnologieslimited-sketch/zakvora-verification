/* ========================================
   ZAKVORA Task Verification – Logic
   ======================================== */

(function () {
  "use strict";

  // ---------- Google Apps Script URL ----------
  const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwl5MtCEvZyqKMikjs4e7tRbaVxfkwE1TX9ZnltlhkuM40mqcYu9MhWxMlAFH3VBk2Q/exec";

  // ---------- Elements ----------
  const form = document.getElementById("verifyForm");
  const uploadGrid = document.getElementById("uploadGrid");
  const uploadCount = document.getElementById("uploadCount");
  const verifyBtn = document.getElementById("verifyBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");
  const successOverlay = document.getElementById("successOverlay");
  const failOverlay = document.getElementById("failOverlay");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const uiuIdEl = document.getElementById("uiuId");
  const copyBtn = document.getElementById("copyBtn");
  const doneBtn = document.getElementById("doneBtn");
  const tryAgainBtn = document.getElementById("tryAgainBtn");
  const menuToggle = document.getElementById("menuToggle");
  const mobileNav = document.getElementById("mobileNav");

  // ---------- State ----------
  const files = [null, null, null, null, null];
  const TOTAL_SLOTS = 5;

  // ---------- Mobile menu ----------
  menuToggle.addEventListener("click", () => {
    mobileNav.classList.toggle("open");
  });

  // ---------- Build upload slots ----------
  function buildSlots() {
    uploadGrid.innerHTML = "";
    for (let i = 0; i < TOTAL_SLOTS; i++) {
      const slot = document.createElement("div");
      slot.className = "upload-slot";
      slot.dataset.index = i;

      slot.innerHTML = `
        <span class="slot-number">${i + 1}</span>
        <span class="slot-label">Group ${i + 1}<br>Screenshot</span>
        <input type="file" accept="image/*" data-index="${i}" />
        <button type="button" class="remove-btn" data-index="${i}" title="Remove">×</button>
      `;

      uploadGrid.appendChild(slot);
    }
  }

  buildSlots();

  // ---------- File handling ----------
  uploadGrid.addEventListener("change", (e) => {
    if (e.target.type !== "file") return;
    const index = parseInt(e.target.dataset.index, 10);
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file only.");
      e.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Image is too large. Please keep it under 8MB.");
      e.target.value = "";
      return;
    }

    files[index] = file;
    showPreview(index, file);
    updateCount();
  });

  uploadGrid.addEventListener("click", (e) => {
    if (!e.target.classList.contains("remove-btn")) return;
    e.preventDefault();
    e.stopPropagation();
    const index = parseInt(e.target.dataset.index, 10);
    files[index] = null;

    const slot = uploadGrid.querySelector(`.upload-slot[data-index="${index}"]`);
    const input = slot.querySelector('input[type="file"]');
    input.value = "";
    const preview = slot.querySelector(".preview");
    if (preview) preview.remove();
    slot.classList.remove("has-file");
    updateCount();
  });

  function showPreview(index, file) {
    const slot = uploadGrid.querySelector(`.upload-slot[data-index="${index}"]`);
    const old = slot.querySelector(".preview");
    if (old) old.remove();

    const img = document.createElement("img");
    img.className = "preview";
    img.alt = `Screenshot ${index + 1}`;
    img.src = URL.createObjectURL(file);
    slot.appendChild(img);
    slot.classList.add("has-file");
  }

  function updateCount() {
    const count = files.filter(Boolean).length;
    uploadCount.textContent = `${count} of ${TOTAL_SLOTS} uploaded`;
    verifyBtn.disabled = count < TOTAL_SLOTS;
  }

  // ---------- Form validation ----------
  function validateForm() {
    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const country = document.getElementById("country").value;
    const city = document.getElementById("city").value.trim();
    const course = document.querySelector('input[name="course"]:checked');

    if (!name) {
      alert("Please enter your full name.");
      return false;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");
      return false;
    }
    if (!phone || phone.length < 10) {
      alert("Please enter a valid phone number.");
      return false;
    }
    if (!country) {
      alert("Please select your country.");
      return false;
    }
    if (!city) {
      alert("Please enter your city.");
      return false;
    }
    if (!course) {
      alert("Please select a course.");
      return false;
    }
    if (files.filter(Boolean).length < TOTAL_SLOTS) {
      alert("Please upload all 5 screenshots.");
      return false;
    }
    return true;
  }

  // ---------- Generate UIU ID ----------
  function generateUIUID(courseValue) {
    const codeMap = {
      "Data Analysis (Beginner)": "DA",
      "Data Analysis (Advanced)": "DAP",
      "Research Support": "RS",
      "AI & Digital Solutions": "AI",
      "ICT Training": "ICT",
      "Business Analytics": "BA"
    };
    const code = codeMap[courseValue] || "GEN";
    const random = Math.floor(10000 + Math.random() * 90000);
    const year = new Date().getFullYear().toString().slice(-2);
    return `UIU-\( {code}- \){year}${random}`;
  }

  // ---------- Send data to Google Sheet ----------
  function sendToGoogleSheet(formData) {
    return fetch(SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });
  }

  // ---------- Mock verification ----------
  function runVerification() {
    loadingOverlay.hidden = false;
    progressFill.style.width = "0%";
    progressText.textContent = "0 of 5 verified";

    let current = 0;

    const interval = setInterval(() => {
      current++;
      const percent = (current / TOTAL_SLOTS) * 100;
      progressFill.style.width = percent + "%";
      progressText.textContent = `${current} of ${TOTAL_SLOTS} verified`;

      if (current >= TOTAL_SLOTS) {
        clearInterval(interval);

        const success = Math.random() > 0.05; // high success rate

        setTimeout(() => {
          loadingOverlay.hidden = true;

          if (success) {
            const course = document.querySelector('input[name="course"]:checked').value;
            const id = generateUIUID(course);
            uiuIdEl.textContent = id;
            successOverlay.hidden = false;

            // Prepare data and send to Google Sheet
            const formData = {
              name: document.getElementById("fullName").value.trim(),
              email: document.getElementById("email").value.trim(),
              phone: document.getElementById("phone").value.trim(),
              country: document.getElementById("country").value,
              city: document.getElementById("city").value.trim(),
              course: course,
              uiuId: id
            };

            sendToGoogleSheet(formData)
              .then(() => console.log("Data sent to Google Sheet"))
              .catch((err) => console.log("Error sending data:", err));

          } else {
            failOverlay.hidden = false;
          }
        }, 600);
      }
    }, 700);
  }

  // ---------- Submit ----------
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    runVerification();
  });

  // ---------- Copy UIU ID ----------
  copyBtn.addEventListener("click", () => {
    const id = uiuIdEl.textContent;
    if (!id || id === "—") return;

    navigator.clipboard.writeText(id).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy ID";
      }, 1800);
    }).catch(() => {
      const temp = document.createElement("textarea");
      temp.value = id;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand("copy");
      document.body.removeChild(temp);
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy ID";
      }, 1800);
    });
  });

  // ---------- Done / Try Again ----------
  doneBtn.addEventListener("click", () => {
    successOverlay.hidden = true;
  });

  tryAgainBtn.addEventListener("click", () => {
    failOverlay.hidden = true;
  });

  // ---------- Init ----------
  updateCount();
})();
