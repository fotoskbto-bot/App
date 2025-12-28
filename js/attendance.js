import { Storage, STORAGE_KEYS } from './storage.js';
import { formatDate, filterList, checkConsecutiveAbsences as checkConsecutiveAbsencesFunc } from './utils.js';
import { getActiveUsers, getUserById } from './users.js';
import { getLatestMembership, getPostExpirationAttendance, checkMembershipStatus } from './income.js';

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
    const latestMembership = getLatestMembership(userId);
    if (!latestMembership) {
        return '<div class="text-warning">Sin membresía activa</div>';
    }
    
    const postExpirationCount = getPostExpirationAttendance(userId, attendance);
    const status = checkMembershipStatus(userId);
    
    let statusClass = 'text-success';
    let statusText = 'Vigente';
    
    if (status === 'vencida') {
        statusClass = 'text-danger';
        statusText = 'Vencida';
    } else if (status === 'por_vencer') {
        statusClass = 'text-warning';
        statusText = 'Por vencer';
    }
    
    const membershipInfo = `
        <div class="membership-info">
            <div class="${statusClass}">
                <strong>${statusText}</strong> - Vence: ${formatDate(latestMembership.endDate)}
            </div>
            ${postExpirationCount > 0 ? 
                `<div class="text-danger">
                    <i class="fas fa-exclamation-triangle"></i> 
                    ${postExpirationCount} clase(s) post vencimiento
                </div>` : ''
            }
        </div>
    `;
    
    return membershipInfo;
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

// Verificar inasistencias consecutivas (versión mejorada)
function checkConsecutiveAbsences() {
    const absenceAlertsList = document.getElementById('absenceAlertsList');
    if (!absenceAlertsList) return;
    
    const activeUsers = getActiveUsers()
        .filter(user => user.affiliationType !== 'Entrenador(a)');
    
    let alertsHTML = '';
    let hasAlerts = false;
    
    activeUsers.forEach(user => {
        // Obtener asistencias del usuario
        const userAttendance = attendance.filter(a => a.userId == user.id);
        
        // Verificar inasistencias consecutivas
        if (checkConsecutiveAbsencesFunc(userAttendance, user.id, 3)) {
            hasAlerts = true;
            alertsHTML += `
                <div class="absence-alert-item">
                    <div class="absence-alert-header">
                        <div>
                            <strong>${user.name}</strong>
                            <span class="badge bg-danger ms-2">3+ ausencias consecutivas</span>
                        </div>
                        <div class="absence-alert-actions">
                            <button class="btn btn-sm btn-outline-info" onclick="window.showEmergencyInfo('${user.id}')">
                                <i class="fas fa-first-aid"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning" onclick="window.sendAttendanceReminder('${user.id}')">
                                <i class="fas fa-envelope"></i> Recordatorio
                            </button>
                        </div>
                    </div>
                    <div class="absence-alert-body">
                        <small>Clase: ${user.classTime || 'No definida'} | Última asistencia: ${getLastAttendanceDate(user.id)}</small>
                    </div>
                </div>
            `;
        }
    });
    
    if (hasAlerts) {
        absenceAlertsList.innerHTML = alertsHTML;
    } else {
        absenceAlertsList.innerHTML = '<p class="text-muted">No hay alertas de inasistencias en este momento.</p>';
    }
}

// Función auxiliar para obtener última fecha de asistencia
function getLastAttendanceDate(userId) {
    const userAttendance = attendance
        .filter(a => a.userId == userId && a.status === 'presente')
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return userAttendance.length > 0 ? formatDate(userAttendance[0].date) : 'Nunca';
}

// Verificar cumpleaños próximos (para mostrar en asistencia)
function checkUpcomingBirthdays() {
    const activeUsers = getActiveUsers();
    const today = new Date();
    
    activeUsers.forEach(user => {
        if (user.birthdate) {
            const birthday = new Date(user.birthdate);
            const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
            
            // Ajustar si el cumpleaños ya pasó este año
            if (nextBirthday < today) {
                nextBirthday.setFullYear(today.getFullYear() + 1);
            }
            
            const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
            
            // Mostrar alerta si el cumpleaños es en los próximos 7 días
            if (daysUntilBirthday <= 7 && daysUntilBirthday >= 0) {
                console.log(`🎂 ${user.name} cumple en ${daysUntilBirthday} días`);
                // Podríamos agregar una alerta visual en la interfaz
            }
        }
    });
}

// En la función loadAttendanceByClass, agregar verificación de cumpleaños
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
        
        // Verificar si está próximo el cumpleaños
        const birthdayBadge = getBirthdayBadge(user.birthdate);

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
                <div class="attendance-user-name">
                    ${user.name} ${birthdayBadge}
                </div>
                <div class="attendance-user-details">
                    ${membershipInfo}
                    <div class="user-class-time">
                        <small>${user.classTime || 'Sin clase asignada'}</small>
                    </div>
                </div>
            </div>
            <div class="attendance-actions">
                <button class="btn btn-sm btn-outline-info" onclick="window.showEmergencyInfo('${user.id}')">
                    <i class="fas fa-first-aid"></i>
                </button>
                ${!isPresent ? `
                    <button class="btn btn-sm btn-outline-warning" onclick="window.sendAttendanceReminder('${user.id}')">
                        <i class="fas fa-bell"></i>
                    </button>
                ` : ''}
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
    
    // Verificar cumpleaños próximos
    checkUpcomingBirthdays();
}

// Función para obtener badge de cumpleaños
function getBirthdayBadge(birthdate) {
    if (!birthdate) return '';
    
    const today = new Date();
    const birthday = new Date(birthdate);
    const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
    
    // Ajustar si el cumpleaños ya pasó este año
    if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
    }
    
    const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilBirthday <= 7 && daysUntilBirthday >= 0) {
        if (daysUntilBirthday === 0) {
            return '<span class="badge bg-birthday">🎂 ¡Hoy!</span>';
        } else if (daysUntilBirthday === 1) {
            return '<span class="badge bg-birthday">🎂 Mañana</span>';
        } else {
            return `<span class="badge bg-birthday">🎂 En ${daysUntilBirthday} días</span>`;
        }
    }
    
    return '';
}

// Agregar función global para enviar recordatorios
window.sendAttendanceReminder = function(userId) {
    const user = getUserById(userId);
    if (!user || !user.phone) {
        alert('Usuario no encontrado o sin número de teléfono');
        return;
    }
    
    const message = `Hola ${user.name}, te recordamos tu clase de hoy en Antología Box23. ¡Te esperamos!`;
    
    // Abrir WhatsApp con el mensaje
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/57${cleanPhone(user.phone)}?text=${encodedMessage}`, '_blank');
};

// Función auxiliar para limpiar teléfono (debería estar importada de utils.js)
function cleanPhone(phone) {
    return phone ? phone.toString().replace(/\D/g, '') : '';
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
