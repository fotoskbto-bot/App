import { Storage, STORAGE_KEYS } from './storage.js';
import { formatDate, filterList } from './utils.js';
import { getActiveUsers, getUserById } from './users.js';

// Variables locales
let attendance = [];

// Inicializar asistencia
export function initAttendance() {
    // Cargar asistencia desde localStorage
    attendance = Storage.get(STORAGE_KEYS.ATTENDANCE, []);
    
    // Configurar event listeners
    setupAttendanceEventListeners();
    
    // Cargar asistencia inicial
    loadAttendanceByClass();
    loadAttendance();
}

// Configurar event listeners para asistencia
function setupAttendanceEventListeners() {
    // Botón para guardar asistencias
    const saveAttendanceBtn = document.getElementById('saveAttendance');
    if (saveAttendanceBtn) {
        saveAttendanceBtn.addEventListener('click', saveAttendanceHandler);
    }
    
    // Botón para actualizar lista
    const refreshAttendanceBtn = document.getElementById('refreshAttendance');
    if (refreshAttendanceBtn) {
        refreshAttendanceBtn.addEventListener('click', loadAttendanceByClass);
    }
    
    // Botón para marcar todos presentes
    const markAllPresentBtn = document.getElementById('markAllPresent');
    if (markAllPresentBtn) {
        markAllPresentBtn.addEventListener('click', markAllPresent);
    }
    
    // Botón para limpiar todo
    const clearAllAttendanceBtn = document.getElementById('clearAllAttendance');
    if (clearAllAttendanceBtn) {
        clearAllAttendanceBtn.addEventListener('click', clearAllAttendance);
    }
    
    // Cambio de fecha
    const attendanceDate = document.getElementById('attendanceDate');
    if (attendanceDate) {
        attendanceDate.addEventListener('change', loadAttendanceByClass);
    }
    
    // Buscador de asistencia
    const attendanceSearchInput = document.getElementById('attendanceSearchInput');
    if (attendanceSearchInput) {
        attendanceSearchInput.addEventListener('input', filterAttendanceUsers);
    }
    
    // Botón de filtrar historial
    const filterAttendanceBtn = document.getElementById('filterAttendanceBtn');
    if (filterAttendanceBtn) {
        filterAttendanceBtn.addEventListener('click', loadAttendance);
    }
    
    // Buscador en tabla de historial
    const attendanceTableSearch = document.getElementById('attendanceTableSearch');
    if (attendanceTableSearch) {
        attendanceTableSearch.addEventListener('input', filterAttendanceTable);
    }
}

// Cargar asistencias por clase (lista ordenada alfabéticamente)
function loadAttendanceByClass() {
    const attendanceDate = document.getElementById('attendanceDate').value;
    const attendanceUsersList = document.getElementById('attendanceUsersList');
    if (!attendanceUsersList) return;
    
    attendanceUsersList.innerHTML = '';

    const activeUsers = getActiveUsers()
        .filter(user => user.affiliationType !== 'Entrenador(a)')
        .sort((a, b) => a.name.localeCompare(b.name));

    let totalUsers = activeUsers.length;
    let presentUsers = 0;

    activeUsers.forEach(user => {
        const isPresent = attendance.some(a =>
            a.userId === user.id &&
            a.date === attendanceDate &&
            a.status === 'presente'
        );

        if (isPresent) presentUsers++;

        // Verificar estado de membresía
        const membershipInfo = getMembershipInfo(user.id);

        const userItem = document.createElement('div');
        userItem.className = 'attendance-user-item';
        userItem.innerHTML = `
            <div class="attendance-check-container">
                <input class="form-check-input attendance-checkbox" type="checkbox" 
                    id="attendance-${user.id}" 
                    data-user-id="${user.id}"
                    ${isPresent ? 'checked' : ''}>
            </div>
            <div class="attendance-user-info">
                <div class="attendance-user-name">${user.name}</div>
                <div class="attendance-user-details">
                    ${membershipInfo}
                </div>
            </div>
            <div class="attendance-actions">
                <button class="btn btn-sm btn-outline-info" onclick="window.showEmergencyInfo('${user.id}')">
                    <i class="fas fa-first-aid"></i>
                </button>
            </div>
        `;

        attendanceUsersList.appendChild(userItem);
    });

    // Actualizar estadísticas
    updateAttendanceStats(totalUsers, presentUsers);

    // Agregar event listeners a los checkboxes
    document.querySelectorAll('.attendance-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => updateAttendanceStats(totalUsers));
    });

    // Verificar inasistencias consecutivas
    checkConsecutiveAbsences();
}

// Obtener información de membresía
function getMembershipInfo(userId) {
    // Esta función debería implementarse con lógica de membresía
    // Por ahora, devolvemos un string vacío
    return '';
}

// Actualizar estadísticas de asistencia
function updateAttendanceStats(totalUsers, presentUsers = null) {
    if (presentUsers === null) {
        const presentCheckboxes = document.querySelectorAll('.attendance-checkbox:checked').length;
        presentUsers = presentCheckboxes;
    }
    
    const totalUsersCount = document.getElementById('totalUsersCount');
    const presentUsersCount = document.getElementById('presentUsersCount');
    const pendingUsersCount = document.getElementById('pendingUsersCount');
    
    if (totalUsersCount) totalUsersCount.textContent = totalUsers;
    if (presentUsersCount) presentUsersCount.textContent = presentUsers;
    if (pendingUsersCount) pendingUsersCount.textContent = totalUsers - presentUsers;
}

// Marcar todos presentes
function markAllPresent() {
    const checkboxes = document.querySelectorAll('.attendance-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    const totalUsers = checkboxes.length;
    updateAttendanceStats(totalUsers, totalUsers);
}

// Limpiar todo
function clearAllAttendance() {
    const checkboxes = document.querySelectorAll('.attendance-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    const totalUsers = checkboxes.length;
    updateAttendanceStats(totalUsers, 0);
}

// Guardar asistencias
function saveAttendanceHandler() {
    const attendanceDate = document.getElementById('attendanceDate').value;
    const checkboxes = document.querySelectorAll('.attendance-checkbox');
    let savedCount = 0;

    // Eliminar asistencias previas para esta fecha
    attendance = attendance.filter(a => a.date !== attendanceDate);

    checkboxes.forEach(checkbox => {
        const userId = checkbox.dataset.userId;
        const isPresent = checkbox.checked;

        if (isPresent) {
            const attendanceRecord = {
                id: Date.now() + savedCount,
                userId: userId,
                date: attendanceDate,
                status: 'presente',
                registeredAt: new Date().toISOString()
            };
            
            attendance.push(attendanceRecord);
            addAttendanceRecord(attendanceRecord);
            savedCount++;
        }
    });

    // Guardar en localStorage
    Storage.set(STORAGE_KEYS.ATTENDANCE, attendance);

    // Recargar
    loadAttendanceByClass();
    loadAttendance();

    alert(`Asistencias guardadas correctamente. Total: ${savedCount}`);
}

// Cargar lista de asistencias (historial)
export function loadAttendance() {
    const attendanceList = document.getElementById('attendanceList');
    if (!attendanceList) return;
    
    attendanceList.innerHTML = '';
    
    const startDate = document.getElementById('attendanceStartDateFilter').value;
    const endDate = document.getElementById('attendanceEndDateFilter').value;
    const userId = document.getElementById('attendanceUserFilter').value;

    let filteredAttendance = attendance;

    // Filtrar por fecha
    if (startDate && endDate) {
        filteredAttendance = filteredAttendance.filter(a => a.date >= startDate && a.date <= endDate);
    }

    // Filtrar por usuario
    if (userId) {
        filteredAttendance = filteredAttendance.filter(a => a.userId == userId);
    }

    // Obtener usuarios para mostrar nombres
    const users = getActiveUsers();

    filteredAttendance.forEach(record => {
        const user = users.find(u => u.id == record.userId) || { name: 'Usuario eliminado', classTime: 'N/A' };
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.date}</td>
            <td>${user.name}</td>
            <td>${user.classTime}</td>
            <td>
                <span class="badge ${getStatusBadgeClass(record.status)}">${record.status}</span>
            </td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteAttendance(${record.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        attendanceList.appendChild(row);
    });
}

// Obtener clase CSS para el badge de estado
function getStatusBadgeClass(status) {
    switch (status) {
        case 'presente': return 'bg-success';
        case 'ausente': return 'bg-danger';
        case 'tarde': return 'bg-warning';
        case 'permiso': return 'bg-info';
        default: return 'bg-secondary';
    }
}

// Eliminar registro de asistencia
window.deleteAttendance = function(attendanceId) {
    if (confirm('¿Está seguro de que desea eliminar este registro de asistencia?')) {
        attendance = attendance.filter(a => a.id !== attendanceId);
        Storage.set(STORAGE_KEYS.ATTENDANCE, attendance);
        loadAttendance();
        alert('Registro de asistencia eliminado correctamente.');
    }
};

// Filtrar usuarios en la lista de asistencia
function filterAttendanceUsers() {
    const searchText = document.getElementById('attendanceSearchInput').value.toLowerCase();
    const userItems = document.querySelectorAll('.attendance-user-item');

    userItems.forEach(item => {
        const userName = item.querySelector('.attendance-user-name').textContent.toLowerCase();
        if (userName.includes(searchText)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Filtrar tabla de asistencias
function filterAttendanceTable() {
    const searchText = document.getElementById('attendanceTableSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#attendanceTable tbody tr');
    
    rows.forEach(row => {
        const userName = row.cells[1].textContent.toLowerCase();
        const userClass = row.cells[2].textContent.toLowerCase();
        const userStatus = row.cells[3].textContent.toLowerCase();
        
        if (userName.includes(searchText) || userClass.includes(searchText) || userStatus.includes(searchText)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Verificar inasistencias consecutivas
function checkConsecutiveAbsences() {
    const absenceAlertsList = document.getElementById('absenceAlertsList');
    if (!absenceAlertsList) return;
    
    absenceAlertsList.innerHTML = '<p class="text-muted">No hay alertas de inasistencias en este momento.</p>';
}

// Obtener la última membresía de un usuario
export function getLatestMembership(userId) {
    const userIncome = income.filter(i => i.userId == userId);
    if (userIncome.length === 0) return null;
    
    // Ordenar por fecha de pago descendente
    userIncome.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    return userIncome[0];
}

// Obtener clases asistidas después del vencimiento
export function getPostExpirationAttendance(userId, attendanceRecords) {
    const latestMembership = getLatestMembership(userId);
    if (!latestMembership || !latestMembership.endDate) return 0;
    
    const endDate = new Date(latestMembership.endDate);
    endDate.setDate(endDate.getDate() + 1); // Sumar un día
    
    return attendanceRecords.filter(a => 
        a.userId == userId && 
        a.status === 'presente' &&
        new Date(a.date) > endDate
    ).length;
}

// Verificar estado de membresía
export function checkMembershipStatus(userId) {
    const latestMembership = getLatestMembership(userId);
    if (!latestMembership) return 'sin_pago';
    
    const today = new Date();
    const endDate = new Date(latestMembership.endDate);
    
    if (today > endDate) return 'vencida';
    if (daysUntil(latestMembership.endDate) <= 3) return 'por_vencer';
    return 'vigente';
}

// Obtener toda la asistencia
export function getAllAttendance() {
    return attendance;
}

// Obtener asistencia por usuario
export function getAttendanceByUserId(userId) {
    return attendance.filter(a => a.userId === userId);
}

// Agregar registro de asistencia
export function addAttendanceRecord(record) {
    attendance.push(record);
    Storage.set(STORAGE_KEYS.ATTENDANCE, attendance);
}

// Recargar asistencia desde localStorage (para restauración)
export function reloadAttendanceFromStorage() {
    attendance = Storage.get(STORAGE_KEYS.ATTENDANCE, []);
    loadAttendanceByClass();
    loadAttendance();
}

// Exponer funciones globalmente si es necesario
window.loadAttendance = loadAttendance;
