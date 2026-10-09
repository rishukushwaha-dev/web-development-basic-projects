let students = [];
let currentEditId = null;

function init() {
  loadStudents();
  setupNavigation();
  setupAttendanceDate();
  renderAll();
}

function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");
      const section = item.getAttribute("data-section");
      document
        .querySelectorAll(".section")
        .forEach((s) => s.classList.remove("active"));
      document.getElementById(section).classList.add("active");
      if (section === "attendance") {
        loadAttendanceForDate();
      }
    });
  });
}

function setupAttendanceDate() {
  const dateInput = document.getElementById("attendance-date");
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.value = yyyy + "-" + mm + "-" + dd;
    loadAttendanceForDate();
  }
}

function loadStudents() {
  const data = localStorage.getItem("students");
  if (data) {
    students = JSON.parse(data);
  } else {
    students = [
      {
        id: Date.now() - 3,
        name: "Aarav Sharma",
        roll: "SZ-101",
        course: "B.Sc Zoology",
        email: "aarav@example.com",
        phone: "9876543210",
      },
      {
        id: Date.now() - 2,
        name: "Priya Singh",
        roll: "SB-102",
        course: "B.Sc Botany",
        email: "priya@example.com",
        phone: "9876543211",
      },
      {
        id: Date.now() - 1,
        name: "Rohan Verma",
        roll: "EM-103",
        course: "English Minor",
        email: "rohan@example.com",
        phone: "9876543212",
      },
    ];
    saveStudents();
  }
}

function saveStudents() {
  localStorage.setItem("students", JSON.stringify(students));
}

function addStudent() {
  const nameInput = document.getElementById("student-name");
  const rollInput = document.getElementById("student-roll");
  const courseSelect = document.getElementById("student-course");
  const emailInput = document.getElementById("student-email");
  const phoneInput = document.getElementById("student-phone");
  const name = nameInput.value.trim();
  const roll = rollInput.value.trim();
  const course = courseSelect.value;
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  if (!name || !roll || !course) {
    alert("Please fill in name, roll number, and course.");
    return;
  }
  if (students.find((s) => s.roll.toLowerCase() === roll.toLowerCase())) {
    alert("Roll number already exists!");
    return;
  }
  students.push({ id: Date.now(), name, roll, course, email, phone });
  saveStudents();
  renderAll();
  resetForm();
  alert("Student added successfully!");
}

function updateStudent() {
  if (currentEditId === null) return;
  const nameInput = document.getElementById("student-name");
  const rollInput = document.getElementById("student-roll");
  const courseSelect = document.getElementById("student-course");
  const emailInput = document.getElementById("student-email");
  const phoneInput = document.getElementById("student-phone");
  const name = nameInput.value.trim();
  const roll = rollInput.value.trim();
  const course = courseSelect.value;
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  if (!name || !roll || !course) {
    alert("Please fill in name, roll number, and course.");
    return;
  }
  const exists = students.find(
    (s) =>
      s.roll.toLowerCase() === roll.toLowerCase() && s.id !== currentEditId,
  );
  if (exists) {
    alert("Roll number already exists!");
    return;
  }
  const idx = students.findIndex((s) => s.id === currentEditId);
  if (idx > -1) {
    students[idx] = { id: currentEditId, name, roll, course, email, phone };
    saveStudents();
    renderAll();
    resetForm();
    alert("Student updated successfully!");
  }
}

function editStudent(id) {
  const student = students.find((s) => s.id === id);
  if (!student) return;
  document.getElementById("student-name").value = student.name;
  document.getElementById("student-roll").value = student.roll;
  document.getElementById("student-course").value = student.course;
  document.getElementById("student-email").value = student.email;
  document.getElementById("student-phone").value = student.phone;
  currentEditId = id;
  document.getElementById("add-student-btn").style.display = "none";
  document.getElementById("update-student-btn").style.display = "inline-block";
  document
    .querySelectorAll(".nav-item")
    .forEach((nav) => nav.classList.remove("active"));
  document.querySelectorAll(".nav-item")[1].classList.add("active");
  document
    .querySelectorAll(".section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById("students").classList.add("active");
  document.getElementById("student-name").focus();
}

function deleteStudent(id) {
  if (!confirm("Are you sure you want to delete this student?")) return;
  students = students.filter((s) => s.id !== id);
  saveStudents();
  renderAll();
  loadAttendanceForDate();
}

function clearAllStudents() {
  if (
    !confirm(
      "Are you sure you want to REMOVE ALL students? This cannot be undone.",
    )
  )
    return;
  if (
    !confirm(
      "This will delete all students and their attendance records as well. Continue?",
    )
  )
    return;
  students = [];
  saveStudents();
  // Clear all attendance keys
  for (var i = localStorage.length - 1; i >= 0; i--) {
    var key = localStorage.key(i);
    if (key && key.indexOf("attendance_") === 0) {
      localStorage.removeItem(key);
    }
  }
  renderAll();
  loadAttendanceForDate();
}

function resetForm() {
  document.getElementById("student-name").value = "";
  document.getElementById("student-roll").value = "";
  document.getElementById("student-course").value = "";
  document.getElementById("student-email").value = "";
  document.getElementById("student-phone").value = "";
  currentEditId = null;
  document.getElementById("add-student-btn").style.display = "inline-block";
  document.getElementById("update-student-btn").style.display = "none";
}

function searchStudents() {
  const term = document.getElementById("search-input").value.toLowerCase();
  renderStudentTable(term);
}

function renderAll() {
  renderDashboard();
  renderStudentTable();
  updateStats();
  loadAttendanceForDate();
}

function renderDashboard() {
  const tbody = document.getElementById("dashboard-table-body");
  tbody.innerHTML = "";
  students
    .slice(-5)
    .reverse()
    .forEach((student, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        (idx + 1) +
        "</td><td>" +
        escapeHtml(student.name) +
        "</td><td>" +
        escapeHtml(student.roll) +
        "</td><td>" +
        escapeHtml(student.course) +
        "</td>";
      tbody.appendChild(tr);
    });
}

function renderStudentTable(searchTerm) {
  if (searchTerm === undefined) searchTerm = "";
  const tbody = document.getElementById("student-table-body");
  tbody.innerHTML = "";
  let filtered = students;
  if (searchTerm) {
    filtered = students.filter(
      (s) =>
        s.name.toLowerCase().includes(searchTerm) ||
        s.roll.toLowerCase().includes(searchTerm) ||
        s.course.toLowerCase().includes(searchTerm),
    );
  }
  filtered.forEach((student, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" +
      (idx + 1) +
      "</td><td>" +
      escapeHtml(student.name) +
      "</td><td>" +
      escapeHtml(student.roll) +
      "</td><td>" +
      escapeHtml(student.course) +
      "</td><td>" +
      escapeHtml(student.email) +
      "</td><td>" +
      escapeHtml(student.phone) +
      '</td><td><button class="action-btn edit-btn" onclick="editStudent(' +
      student.id +
      ')">Edit</button> <button class="action-btn delete-btn" onclick="deleteStudent(' +
      student.id +
      ')">Delete</button></td>';
    tbody.appendChild(tr);
  });
}

function updateStats() {
  const totalEl = document.getElementById("total-students");
  if (totalEl) totalEl.innerText = students.length;
}

function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function getAttendanceKey(date) {
  return "attendance_" + date;
}

function loadAttendanceForDate() {
  const dateInput = document.getElementById("attendance-date");
  const tbody = document.getElementById("attendance-table-body");
  const summary = document.getElementById("att-summary");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!dateInput || !dateInput.value) return;
  const key = getAttendanceKey(dateInput.value);
  const saved = localStorage.getItem(key);
  let attMap = {};
  if (saved) {
    try {
      attMap = JSON.parse(saved);
    } catch (e) {
      attMap = {};
    }
  }
  if (students.length === 0) {
    if (summary)
      summary.innerText = "No students available. Add students first.";
    return;
  }
  students.forEach((student, idx) => {
    const status = attMap[student.id] || "absent";
    const tr = document.createElement("tr");
    var checkedPresent = status === "present" ? "checked" : "";
    var checkedAbsent = status === "absent" ? "checked" : "";
    tr.innerHTML =
      "<td>" +
      (idx + 1) +
      "</td><td>" +
      escapeHtml(student.name) +
      "</td><td>" +
      escapeHtml(student.roll) +
      "</td><td>" +
      escapeHtml(student.course) +
      '</td><td><label class="radio-label"><input type="radio" name="att_' +
      student.id +
      '" value="present" ' +
      checkedPresent +
      '> Present</label></td><td><label class="radio-label"><input type="radio" name="att_' +
      student.id +
      '" value="absent" ' +
      checkedAbsent +
      "> Absent</label></td>";
    tbody.appendChild(tr);
  });
  updateAttendanceSummary(attMap);
}

function saveAttendance() {
  const dateInput = document.getElementById("attendance-date");
  if (!dateInput || !dateInput.value) {
    alert("Select a date first");
    return;
  }
  const attMap = {};
  students.forEach(function (s) {
    const radios = document.getElementsByName("att_" + s.id);
    var found = false;
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].checked) {
        attMap[s.id] = radios[i].value;
        found = true;
        break;
      }
    }
    if (!found) attMap[s.id] = "absent";
  });
  const key = getAttendanceKey(dateInput.value);
  localStorage.setItem(key, JSON.stringify(attMap));
  updateAttendanceSummary(attMap);
  alert("Attendance saved for " + dateInput.value);
}

function markAllPresent() {
  students.forEach(function (s) {
    const radios = document.getElementsByName("att_" + s.id);
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].value === "present") radios[i].checked = true;
    }
  });
}

function markAllAbsent() {
  students.forEach(function (s) {
    const radios = document.getElementsByName("att_" + s.id);
    for (var i = 0; i < radios.length; i++) {
      if (radios[i].value === "absent") radios[i].checked = true;
    }
  });
}

function updateAttendanceSummary(attMap) {
  const summary = document.getElementById("att-summary");
  let present = 0,
    absent = 0;
  students.forEach(function (s) {
    const st = attMap[s.id] || "absent";
    if (st === "present") present++;
    else absent++;
  });
  if (summary)
    summary.innerText =
      "Total: " +
      students.length +
      " | Present: " +
      present +
      " | Absent: " +
      absent;
  const todayEl = document.getElementById("attendance-today");
  if (todayEl) {
    const dateInput = document.getElementById("attendance-date");
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const todayStr = yyyy + "-" + mm + "-" + dd;
    if (dateInput && dateInput.value === todayStr) {
      if (students.length === 0) todayEl.innerText = "0%";
      else
        todayEl.innerText = Math.round((present / students.length) * 100) + "%";
    }
  }
}

(function(){ var d=document.getElementById('attendance-date'); if(d){ d.addEventListener('change', loadAttendanceForDate); }})();
document.addEventListener("DOMContentLoaded", init);