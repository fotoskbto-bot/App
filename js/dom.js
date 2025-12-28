export const DOM = {};

export function cacheDOM() {
    DOM.userForm = document.getElementById("userForm");
    DOM.usersList = document.getElementById("usersList");
    DOM.searchUserInput = document.getElementById("searchUserInput");

    DOM.attendanceDate = document.getElementById("attendanceDate");
    DOM.attendanceUsersList = document.getElementById("attendanceUsersList");
    DOM.saveAttendance = document.getElementById("saveAttendance");

    DOM.incomeForm = document.getElementById("incomeForm");
    DOM.incomeList = document.getElementById("incomeList");
}