let aktivitas = "kenyang";

if (aktivitas === "kenyang") {
  console.log("cukup mukbang");
} else {
  console.log("cukup minum air teh");
}

// Smooth scroll for anchor links
document.addEventListener("click", function (e) {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute("href");
  if (href.length > 1) {
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
});

// Scroll-triggered reveal
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  { threshold: 0.18 }
);

document
  .querySelectorAll("[data-animate]")
  .forEach((el) => observer.observe(el));
document.querySelectorAll(".step").forEach((el) => observer.observe(el));
document.querySelectorAll(".benefit").forEach((el) => observer.observe(el));
document.querySelector(".testimonial-inline") &&
  observer.observe(document.querySelector(".testimonial-inline"));

// Enhanced carousel (fixed)
(() => {
  const track = document.querySelector(".carousel-track");
  if (!track) return;
  const quotes = Array.from(track.children);
  if (!quotes.length) return;
  let index = 0;
  const prevBtn = document.querySelector(".carousel-btn.prev");
  const nextBtn = document.querySelector(".carousel-btn.next");

  // ensure buttons exist
  if (prevBtn) prevBtn.addEventListener("click", () => changeSlide(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => changeSlide(1));

  function update(animate = true) {
    track.style.transition = animate ? "transform 0.5s ease" : "none";
    track.style.transform = `translateX(-${index * 100}%)`;
  }

  function changeSlide(dir) {
    index = (index + dir + quotes.length) % quotes.length;
    update(true);
  }

  // Auto-rotate
  let autoRotate = null;
  function startAutoRotate() {
    stopAutoRotate();
    autoRotate = setInterval(() => changeSlide(1), 5000);
  }
  function stopAutoRotate() {
    if (autoRotate) {
      clearInterval(autoRotate);
      autoRotate = null;
    }
  }

  // Pause/resume on interaction
  [track, prevBtn, nextBtn].forEach((el) => {
    if (!el) return;
    el.addEventListener("mouseenter", stopAutoRotate);
    el.addEventListener("mouseleave", startAutoRotate);
    el.addEventListener("focusin", stopAutoRotate);
    el.addEventListener("focusout", startAutoRotate);
  });

  // init
  update(false);
  startAutoRotate();
})();
// Signup form handling (no backend) - store in localStorage
const form = document.getElementById("signup-form");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const skills = document.getElementById("skills").value.trim();
    if (!email) return showToast("Masukkan email valid.", true);

    const stored = JSON.parse(
      localStorage.getItem("fleksijob_signups") || "[]"
    );
    stored.push({ email, skills, ts: new Date().toISOString() });
    localStorage.setItem("fleksijob_signups", JSON.stringify(stored));

    // success flow: reset, announce to SR, show toast and modal, enable export
    form.reset();
    const btn = form.querySelector("button");
    const orig = btn.innerText;
    btn.innerText = "Terima Kasih!";
    btn.disabled = true;
    announce(`Terima kasih! Kami akan kirim informasi ke ${email}`);
    showToast("Terima kasih! Email berhasil didaftarkan.");
    // show modal
    const modal = document.getElementById("modal");
    if (modal) modal.setAttribute("aria-hidden", "false");
    // reveal export button
    const exportBtnLocal = document.getElementById("export-csv");
    if (exportBtnLocal) exportBtnLocal.parentElement.classList.remove("hidden");
    // refresh export count
    if (typeof updateExportCount === "function") updateExportCount();
    setTimeout(() => {
      btn.innerText = orig;
      btn.disabled = false;
    }, 2200);
  });
}

// micro-interaction removed: hero progress bar was cleared from markup

// Accessibility: allow carousel buttons keyboard control
document.querySelectorAll(".carousel-btn").forEach((btn) => {
  btn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") btn.click();
  });
});

// Ensure focus outlines for keyboard users
document.body.addEventListener("keydown", (e) => {
  if (e.key === "Tab") document.documentElement.classList.add("show-focus");
});

/* --- Helpers: Toast, ARIA announcer, CSV export, theme toggle --- */
function showToast(message, isError = false, action) {
  const t = document.getElementById("toast");
  if (!t) return alert(message);
  // clear previous
  t.innerHTML = "";
  const msg = document.createElement("span");
  msg.className = "toast-message";
  msg.textContent = message;
  t.appendChild(msg);

  if (action && action.text) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toast-action";
    btn.textContent = action.text;
    btn.addEventListener("click", () => {
      try {
        action.onClick && action.onClick();
      } catch (err) {
        console.error(err);
      }
      t.classList.remove("show");
      t.setAttribute("aria-hidden", "true");
    });
    t.appendChild(btn);
  }

  t.classList.add("show");
  t.setAttribute("aria-hidden", "false");
  t.classList.toggle("toast-error", !!isError);
  // reset any existing timeout
  clearTimeout(t._hideTimeout);
  t._hideTimeout = setTimeout(() => {
    t.classList.remove("show");
    t.setAttribute("aria-hidden", "true");
    t.classList.remove("toast-error");
  }, 4500);
}

function announce(text) {
  const a = document.getElementById("aria-live");
  if (a) {
    a.textContent = text;
  }
}

// Export signups to CSV
const exportBtn = document.getElementById("export-csv");
if (exportBtn) {
  exportBtn.addEventListener("click", () => {
    const data = JSON.parse(localStorage.getItem("fleksijob_signups") || "[]");
    if (!data.length)
      return showToast("Belum ada signup untuk diexport.", true);
    const rows = [["email", "skills", "ts"]];
    data.forEach((r) =>
      rows.push([
        r.email.replace(/"/g, '""'),
        r.skills.replace(/"/g, '""'),
        r.ts,
      ])
    );
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fleksijob_signups.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Export CSV siap diunduh.");
  });
}

// utility: update export count badge
function updateExportCount() {
  const badge = document.getElementById("export-count");
  const data = JSON.parse(localStorage.getItem("fleksijob_signups") || "[]");
  if (badge) badge.textContent = String(data.length || 0);
}
updateExportCount();

// remove-last signup with undo
const removeLastBtn = document.getElementById("remove-last");
if (removeLastBtn) {
  removeLastBtn.addEventListener("click", () => {
    const data = JSON.parse(localStorage.getItem("fleksijob_signups") || "[]");
    if (!data.length) return showToast("Tidak ada signup untuk dihapus.", true);
    // open confirm modal and store removed candidate temporary
    const confirmModal = document.getElementById("confirm-modal");
    if (!confirmModal) return;
    confirmModal._toDelete = data[data.length - 1];
    confirmModal.setAttribute("aria-hidden", "false");
    // focus panel
    const panel = confirmModal.querySelector(".modal-panel");
    if (panel) panel.focus();
  });
}

// Removed Web3 theme toggle - only night/light (premium) mode remains

// Premium theme toggle (dark/light) with persistence
const premiumBtn = document.getElementById("premium-toggle");
function applyPersistedTheme() {
  let pref = localStorage.getItem("fleksi_theme");
  // default to light if no preference set
  if (!pref) {
    pref = "premium-light";
    localStorage.setItem("fleksi_theme", pref);
  }
  const root = document.documentElement;
  // remove previous premium classes
  root.classList.remove("theme-premium-dark", "theme-premium-light");
  if (pref === "premium-dark") root.classList.add("theme-premium-dark");
  else if (pref === "premium-light") root.classList.add("theme-premium-light");
  if (premiumBtn) premiumBtn.setAttribute("aria-pressed", String(!!pref));
  // ensure the icon matches the applied theme
  try {
    updateModeIcon();
  } catch (e) {}
}
applyPersistedTheme();
if (premiumBtn) {
  premiumBtn.addEventListener("click", () => {
    const root = document.documentElement;
    const current = localStorage.getItem("fleksi_theme");
    if (!current || current === "premium-light") {
      // toggle to dark
      localStorage.setItem("fleksi_theme", "premium-dark");
      root.classList.remove("theme-premium-light");
      root.classList.add("theme-premium-dark");
      updateModeIcon(); // Add this line to update the icon
      showToast("Mode warna diubah: Gelap");
    } else if (current === "premium-dark") {
      // switch to light
      localStorage.setItem("fleksi_theme", "premium-light");
      root.classList.remove("theme-premium-dark");
      root.classList.add("theme-premium-light");
      updateModeIcon(); // Add this line to update the icon
      showToast("Mode warna diubah: Terang");
    }
    premiumBtn.setAttribute("aria-pressed", "true");
  });
}

// helper to update the mode icon image (fallback to emoji)
function updateModeIcon() {
  const img = document.getElementById("mode-icon");
  const pref = localStorage.getItem("fleksi_theme") || "premium-light";
  if (!img) return;
  const nightSrc = "images/mode-night.png";
  const lightSrc = "images/mode-light.png";
  // attempt to use image files; if not found, fallback to emoji via data URL
  const useSrc = pref === "premium-dark" ? nightSrc : lightSrc;
  img.src = useSrc;
  img.onerror = function () {
    // fallback: replace image with emoji text inside button
    const btn = document.getElementById("premium-toggle");
    if (!btn) return;
    img.style.display = "none";
    btn.textContent = pref === "premium-dark" ? "🌙" : "☀️";
  };
}

// set initial icon on load
document.addEventListener("DOMContentLoaded", () => {
  updateModeIcon();
});

// ensure Lottie fallback if not loaded: hide if no player
window.addEventListener("DOMContentLoaded", () => {
  const l = document.getElementById("hero-lottie");
  if (l && typeof l.play === "undefined") {
    l.style.display = "none";
  }
  // Hide export button if no signups yet
  const exportBtnLocal = document.getElementById("export-csv");
  if (exportBtnLocal) {
    const data = JSON.parse(localStorage.getItem("fleksijob_signups") || "[]");
    if (!data.length) exportBtnLocal.parentElement.classList.add("hidden");
  }

  // Hero upload handling: accept .json (Lottie) or video files
  const heroUpload = document.getElementById("hero-upload");
  if (heroUpload) {
    heroUpload.addEventListener("change", (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return showToast("Tidak ada file yang dipilih.", true);
      const url = URL.createObjectURL(file);
      const lottie = document.getElementById("hero-lottie");
      if (file.name.toLowerCase().endsWith(".json") && lottie) {
        // use local blob URL for lottie player
        lottie.setAttribute("src", url);
        showToast("Lottie animation berhasil diunggah.");
      } else {
        // fallback: create/replace video element
        let video = document.querySelector(".hero-right video");
        if (!video) {
          video = document.createElement("video");
          video.className = "hero-video";
          video.autoplay = true;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          const container = document.querySelector(".hero-right .illustration");
          if (container) container.appendChild(video);
        }
        if (video) video.src = url;
        showToast("Video hero berhasil diunggah.");
      }
    });
  }

  // Modal helpers: open/close, overlay click, focus management
  const modal = document.getElementById("modal");
  const modalPanel = modal && modal.querySelector(".modal-panel");
  const modalClose = document.getElementById("modal-close");
  const modalX = document.getElementById("modal-x");
  function openModal() {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "false");
    modal._lastFocus = document.activeElement;
    setTimeout(() => {
      if (modalPanel) modalPanel.focus();
    }, 40);
  }
  function closeModal() {
    if (!modal) return;
    modal.setAttribute("aria-hidden", "true");
    try {
      if (modal._lastFocus) modal._lastFocus.focus();
    } catch (e) {}
  }
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalX) modalX.addEventListener("click", closeModal);
  if (modal)
    modal.addEventListener("click", (ev) => {
      if (ev.target === modal) closeModal();
    });
  // keyboard: Esc to close + focus trap
  document.addEventListener("keydown", (e) => {
    if (!modal) return;
    const isOpen = modal.getAttribute("aria-hidden") === "false";
    if (!isOpen) return;
    if (e.key === "Escape") return closeModal();
    if (e.key === "Tab") {
      const focusable = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Confirm modal wiring (delete confirmation) - attach handlers once
  const confirmModal = document.getElementById("confirm-modal");
  if (confirmModal) {
    const yes = document.getElementById("confirm-yes");
    const no = document.getElementById("confirm-no");
    function closeConfirm() {
      confirmModal.setAttribute("aria-hidden", "true");
      try {
        if (confirmModal._lastFocus) confirmModal._lastFocus.focus();
      } catch (e) {}
    }
    if (no)
      no.addEventListener("click", () => {
        closeConfirm();
      });
    if (yes)
      yes.addEventListener("click", () => {
        // perform delete
        const tmp = confirmModal._toDelete;
        let data = JSON.parse(
          localStorage.getItem("fleksijob_signups") || "[]"
        );
        data.pop();
        localStorage.setItem("fleksijob_signups", JSON.stringify(data));
        updateExportCount();
        closeConfirm();
        // show undo toast
        showToast("Signup terakhir dihapus.", false, {
          text: "Undo",
          onClick: () => {
            const re = JSON.parse(
              localStorage.getItem("fleksijob_signups") || "[]"
            );
            re.push(tmp);
            localStorage.setItem("fleksijob_signups", JSON.stringify(re));
            updateExportCount();
            showToast("Signup dikembalikan.");
          },
        });
      });
  }
});
