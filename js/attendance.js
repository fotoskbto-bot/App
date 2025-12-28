import { Storage, STORAGE_KEYS } from './storage.js';
import { formatDate } from './utils.js';
import { getActiveUsers, getUserById } from './users.js';
import { getMembershipSummary, getMembershipStatus } from './membership.js';

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

        // Obtener información detallada de membresía
        const membershipStatus = getMembershipStatus(user.id);
        const membershipInfo = getMembershipSummary(user.id);
        
        // Determinar clase CSS basada en el estado de membresía
        let userItemClass = 'attendance-user-item';
        if (membershipStatus.expired) {
            if (membershipStatus.daysExpired <= 7) {
                userItemClass += ' membership-warning';
            } else {
                userItemClass += ' membership-expired';
            }
        } else if (membershipStatus.status.includes('Vence en')) {
            userItemClass += ' membership-warning';
        }

        const userItem = document.createElement('div');
        userItem.className = userItemClass;
        userItem.innerHTML = `
            <div class="attendance-check-container">
                <input class="form-check-input attendance-checkbox" type="checkbox" 
                    id="attendance-${user.id}" 
                    data-user-id="${user.id}"
                    ${isPresent ? 'checked' : ''}
                    ${membershipStatus.expired && membershipStatus.daysExpired > 7 ? 'disabled' : ''}>
            </div>
            <div class="attendance-user-info">
                <div class="attendance-user-name">
                    ${user.name}
                    ${membershipStatus.expired && membershipStatus.daysExpired > 7 ? 
                      '<i class="fas fa-exclamation-triangle text-warning ms-2" title="Membresía vencida"></i>' : ''}
                </div>
                <div class="attendance-user-details">
                    <div><strong>Clase:</strong> ${user.classTime || 'Sin clase asignada'}</div>
                    <div class="membership-info mt-1">
                        <strong>Membresía:</strong> ${membershipInfo}
                        ${membershipStatus.attendanceAfterExpiry > 0 ? 
                          `<br><small class="text-danger"><strong>Clases vencidas:</strong> ${membershipStatus.attendanceAfterExpiry} asistidas después del vencimiento</small>` : ''}
                        ${membershipStatus.hasMembership ? 
                          `<br><small class="text-muted"><strong>Vence:</strong> ${membershipStatus.formattedEndDate || 'No definido'}</small>` : ''}
                    </div>
                </div>
            </div>
            <div class="attendance-actions">
                <button class="btn btn-sm btn-outline-info" onclick="window.showEmergencyInfo('${user.id}')">
                    <i class="fas fa-first-aid"></i>
                </button>
                ${membershipStatus.expired ? 
                  `<button class="btn btn-sm btn-outline-warning ms-1" onclick="window.sendPaymentReminder('${user.id}')">
                    <i class="fas fa-money-bill-wave"></i>
                  </button>` : ''}
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

// Obtener información de membresía (compatibilidad con versiones anteriores)
function getMembershipInfo(userId) {
    return getMembershipSummary(userId);
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
    const checkboxes = document.querySelectorAll('.attendance-checkbox:not(:disabled)');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    const totalUsers = document.querySelectorAll('.attendance-checkbox').length;
    const presentUsers = document.querySelectorAll('.attendance-checkbox:checked:not(:disabled)').length;
    updateAttendanceStats(totalUsers, presentUsers);
}

// Limpiar todo
function clearAllAttendance() {
    const checkboxes = document.querySelectorAll('.attendance-checkbox:not(:disabled)');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    const totalUsers = document.querySelectorAll('.attendance-checkbox').length;
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
        
        // Solo guardar si el checkbox no está deshabilitado
        if (!checkbox.disabled && isPresent) {
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

    if (savedCount > 0) {
        alert(`Asistencias guardadas correctamente. Total: ${savedCount}`);
    } else {
        alert('No se guardaron asistencias. Verifique que los usuarios tengan membresía vigente.');
    }
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
    
    absenceAlertsList.innerHTML = '';
    
    const users = getActiveUsers()
        .filter(user => user.affiliationType !== 'Entrenador(a)');
    
    if (users.length === 0) {
        absenceAlertsList.innerHTML = '<p class="text-muted">No hay usuarios activos para verificar.</p>';
        return;
    }
    
    // Definir umbral de inasistencias consecutivas (puedes ajustar este valor)
    const CONSECUTIVE_DAYS_THRESHOLD = 3;
    const DAYS_TO_CHECK = 30; // Revisar los últimos 30 días
    
    const today = new Date();
    const alerts = [];
    
    users.forEach(user => {
        // Obtener asistencias del usuario
        const userAttendance = attendance.filter(a => 
            a.userId === user.id && 
            a.status === 'presente'
        );
        
        // Crear array de fechas de asistencia
        const attendanceDates = userAttendance.map(a => a.date);
        
        // Verificar inasistencias consecutivas
        let consecutiveAbsences = 0;
        let maxConsecutiveAbsences = 0;
        let currentStreakStart = null;
        
        // Revisar los últimos DAYS_TO_CHECK días
        for (let i = 0; i < DAYS_TO_CHECK; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            
            // Si el usuario asistió ese día, reiniciar contador
            if (attendanceDates.includes(dateStr)) {
                consecutiveAbsences = 0;
            } else {
                // Si es la primera inasistencia consecutiva, marcar inicio
                if (consecutiveAbsences === 0) {
                    currentStreakStart = dateStr;
                }
                consecutiveAbsences++;
                maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, consecutiveAbsences);
            }
        }
        
        // Si supera el umbral, crear alerta
        if (maxConsecutiveAbsences >= CONSECUTIVE_DAYS_THRESHOLD) {
            // Encontrar la última fecha de asistencia
            let lastAttendanceDate = 'Nunca';
            if (attendanceDates.length > 0) {
                attendanceDates.sort((a, b) => new Date(b) - new Date(a));
                lastAttendanceDate = formatDate(attendanceDates[0]);
            }
            
            // Obtener información de membresía
            const membershipStatus = getMembershipStatus(user.id);
            
            alerts.push({
                user: user,
                consecutiveAbsences: maxConsecutiveAbsences,
                lastAttendance: lastAttendanceDate,
                membershipStatus: membershipStatus,
                streakStart: currentStreakStart ? formatDate(currentStreakStart) : 'Reciente'
            });
        }
    });
    
    // Mostrar alertas
    if (alerts.length === 0) {
        absenceAlertsList.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i> No hay alertas de inasistencias consecutivas.
            </div>
        `;
        return;
    }
    
    // Ordenar alertas por días de inasistencia (mayor a menor)
    alerts.sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences);
    
    alerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = 'alert alert-warning mb-2';
        alertElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <h6 class="mb-1">
                        <i class="fas fa-exclamation-triangle"></i> 
                        ${alert.user.name}
                    </h6>
                    <div class="mb-1">
                        <span class="badge bg-danger">${alert.consecutiveAbsences} días sin asistir</span>
                        ${alert.membershipStatus.expired ? 
                          '<span class="badge bg-danger ms-1">Membresía vencida</span>' : 
                          '<span class="badge bg-success ms-1">Membresía vigente</span>'}
                    </div>
                    <div class="small">
                        <strong>Última asistencia:</strong> ${alert.lastAttendance}<br>
                        <strong>Inicio de inasistencia:</strong> ${alert.streakStart}<br>
                        <strong>Clase habitual:</strong> ${alert.user.classTime || 'No definida'}
                        ${alert.membershipStatus.attendanceAfterExpiry > 0 ? 
                          `<br><strong>Clases vencidas:</strong> <span class="text-danger">${alert.membershipStatus.attendanceAfterExpiry} asistidas después del vencimiento</span>` : ''}
                    </div>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-warning" onclick="window.sendAbsenceReminder('${alert.user.id}')">
                        <i class="fab fa-whatsapp"></i> Recordar
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="window.showEmergencyInfo('${alert.user.id}')">
                        <i class="fas fa-first-aid"></i>
                    </button>
                </div>
            </div>
        `;
        absenceAlertsList.appendChild(alertElement);
    });
}

// Función para enviar recordatorio de pago por WhatsApp
window.sendPaymentReminder = function(userId) {
    const user = getUserById(userId);
    if (!user) return;
    
    const membershipStatus = getMembershipStatus(userId);
    
    const message = `Hola ${user.name}, tu membresía en Antología Box23 venció hace ${membershipStatus.daysExpired} días. 
Por favor, renueva tu pago para continuar asistiendo a las clases. 
¡Te esperamos!`;
    
    if (user.phone) {
        const phone = user.phone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/57${phone}?text=${encodedMessage}`, '_blank');
    } else {
        alert('El usuario no tiene número de teléfono registrado.');
    }
};

// Función para enviar recordatorio de inasistencia por WhatsApp
window.sendAbsenceReminder = function(userId) {
    const user = getUserById(userId);
    if (!user) return;
    
    const membershipStatus = getMembershipStatus(userId);
    
    let message = `Hola ${user.name}, te extrañamos en Antología Box23. `;
    
    if (membershipStatus.expired) {
        message += `Notamos que tu membresía venció hace ${membershipStatus.daysExpired} días y que no has asistido últimamente. `;
        message += `¿Necesitas renovar tu pago o hay algún motivo por el que no has podido asistir? `;
    } else {
        message += `Notamos que no has asistido a clases recientemente. `;
        message += `¿Todo está bien? Esperamos verte pronto en ${user.classTime || 'tu clase habitual'}. `;
    }
    
    message += `¡Tu salud y bienestar son importantes para nosotros!`;
    
    if (user.phone) {
        const phone = user.phone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/57${phone}?text=${encodedMessage}`, '_blank');
    } else {
        alert('El usuario no tiene número de teléfono registrado.');
    }
};

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

// Exponer funciones globalmente
window.loadAttendance = loadAttendance;
