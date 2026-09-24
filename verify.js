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
  menuToggle.addEventListener("click", function () {
    mobileNav.classList.toggle("open");
  });

  // ---------- Build upload slots ----------
  function buildSlots() {
    uploadGrid.innerHTML = "";
    for (var i = 0; i < TOTAL_SLOTS; i++) {
      var slot = document.createElement("div");
      slot.className = "upload-slot";
      slot.dataset.index = i;

      slot.innerHTML = 
        '<span class="slot-number">' + (i + 1) + '</span>' +
        '<span class="slot-label">Group ' + (i + 1) + '<br>Screenshot</span>' +
        '<input type="file" accept="image/*" data-index="' + i + '" />' +
        '<button type="button" class="remove-btn" data-index="' + i + '" title="Remove">×</button>';

      uploadGrid.appendChild(slot);
    }
  }

  buildSlots();

  // ---------- File handling ----------
  uploadGrid.addEventListener("change", function (e) {
    if (e.target.type !== "file") return;
    var index = parseInt(e.target.dataset.index, 10);
    var file = e.target.files[0];
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

  uploadGrid.addEventListener("click", function (e) {
    if (!e.target.classList.contains("remove-btn")) return;
    e.preventDefault();
    e.stopPropagation();
    var index = parseInt(e.target.dataset.index, 10);
    files[index] = null;

    var slot = uploadGrid.querySelector('.upload-slot[data-index="' + index + '"]');
    var input = slot.querySelector('input[type="file"]');
    input.value = "";
    var preview = slot.querySelector(".preview");
    if (preview) preview.remove();
    slot.classList.remove("has-file");
    updateCount();
  });

  function showPreview(index, file) {
    var slot = uploadGrid.querySelector('.upload-slot[data-index="' + index + '"]');
    var old = slot.querySelector(".preview");
    if (old) old.remove();

    var img = document.createElement("img");
    img.className = "preview";
    img.alt = "Screenshot " + (index + 1);
    img.src = URL.createObjectURL(file);
    slot.appendChild(img);
    slot.classList.add("has-file");
  }

  function updateCount() {
    var count = files.filter(Boolean).length;
    uploadCount.textContent = count + " of " + TOTAL_SLOTS + " uploaded";
    verifyBtn.disabled = count < TOTAL_SLOTS;
  }

  // ---------- Form validation ----------
  function validateForm() {
    var name = document.getElementById("fullName").value.trim();
    var email = document.getElementById("email").value.trim();
    var phone = document.getElementById("phone").value.trim();
    var country = document.getElementById("country").value;
    var city = document.getElementById("city").value.trim();
    var course = document.querySelector('input[name="course"]:checked');

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
    var codeMap = {
      "Data Analysis (Beginner)": "DA",
      "Data Analysis (Advanced)": "DAP",
      "Research Support": "RS",
      "AI & Digital Solutions": "AI",
      "ICT Training": "ICT",
      "Business Analytics": "BA"
    };
    var code = codeMap[courseValue] || "GEN";
    var random =
