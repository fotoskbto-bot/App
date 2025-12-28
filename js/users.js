import { Storage, STORAGE_KEYS } from "./storage.js";
import { isValidPhone, generateNextUserId, formatDate } from "./utils.js";

// Variables globales
let users = [];

// Inicializar usuarios
export function initUsers() {
    // Cargar usuarios desde localStorage
    users = Storage.get(STORAGE_KEYS.USERS, []);
    
    // Configurar event listeners
    setupUserEventListeners();
    
    // Cargar usuarios iniciales
    loadUsers();
}

// Configurar event listeners para usuarios
function setupUserEventListeners() {
    // Formulario de usuario
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', handleUserFormSubmit);
    }
    
    // Búsqueda de usuarios
    const searchInput = document.getElementById('searchUserInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterUsers);
    }
    
    // Botón para mostrar cumpleaños
    const birthdayBtn = document.getElementById('showBirthdaysThisMonth');
    if (birthdayBtn) {
        birthdayBtn.addEventListener('click', () => showBirthdays('month'));
    }
    
    // Botón para guardar usuario editado
    const saveEditBtn = document.getElementById('saveEditUser');
    if (saveEditBtn) {
        saveEditBtn.addEventListener('click', saveEditedUser);
    }
}

// Manejar envío del formulario de usuario
function handleUserFormSubmit(e) {
    e.preventDefault();

    // Validar teléfonos
    const phone = document.getElementById('phone').value;
    const emergencyPhone = document.getElementById('emergencyPhone').value;

    if (!isValidPhone(phone)) {
        alert('El formato del teléfono principal es inválido. Debe tener 10 dígitos y comenzar con 3.');
        return;
    }

    if (!isValidPhone(emergencyPhone)) {
        alert('El formato del teléfono de emergencia es inválido. Debe tener 10 dígitos y comenzar con 3.');
        return;
    }

    const newUser = {
        id: generateNextUserId(users),
        name: document.getElementById('name').value,
        document: document.getElementById('document').value,
        birthdate: document.getElementById('birthdate').value,
        phone: phone,
        eps: document.getElementById('eps').value,
        rh: document.getElementById('rh').value,
        pathology: document.getElementById('pathology').value,
        emergencyContact: document.getElementById('emergencyContact').value,
        emergencyPhone: emergencyPhone,
        classTime: document.getElementById('classTime').value,
        affiliationType: document.getElementById('affiliationType').value,
        status: document.getElementById('status').value,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers();

    loadUsers();
    document.getElementById('userForm').reset();

    alert('Usuario registrado correctamente!');
}

// Guardar usuarios en localStorage
function saveUsers() {
    Storage.set(STORAGE_KEYS.USERS, users);
}

// Cargar lista de usuarios
export function loadUsers() {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const statusBadge = user.status === 'active'
            ? '<span class="badge bg-success user-status-badge">Activo</span>'
            : '<span class="badge bg-danger user-status-badge">Inactivo</span>';

        // Verificar si el usuario tiene cumpleaños próximos (3 días)
        const birthdayInfo = getUpcomingBirthdayInfo(user.birthdate);
        const birthdayBadge = birthdayInfo ? `<span class="birthday-badge">🎂 ${birthdayInfo.daysUntil} días</span>` : '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name} ${birthdayBadge}</td>
            <td>${user.document || '-'}</td>
            <td>${user.phone || '-'}</td>
            <td>${user.classTime || '-'}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-info me-1" onclick="window.editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-warning me-1" onclick="window.showEmergencyInfo('${user.id}')">
                    <i class="fas fa-first-aid"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="window.deleteUser('${user.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        usersList.appendChild(row);
    });

    // Actualizar selects de usuario en otras secciones
    updateUserSelects();
}

// Actualizar selects de usuario
function updateUserSelects() {
    const selects = [
        'incomeUserSelect',
        'incomeFilterUser',
        'attendanceUserFilter',
        'combinedReportUser'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = selectId === 'incomeUserSelect' 
            ? '<option value="">Seleccionar usuario</option>'
            : '<option value="">Todos los usuarios</option>';
        
        users.forEach(user => {
            if (user.status !== 'inactive') {
                const option = document.createElement('option');
                option.value = user.id;
                
                if (selectId === 'incomeUserSelect') {
                    option.textContent = `${user.name} - ${user.classTime} - ${user.document || 'Sin documento'}`;
                } else {
                    option.textContent = user.name;
                }
                
                select.appendChild(option);
            }
        });
    });
}

// Filtrar usuarios
function filterUsers() {
    const searchText = document.getElementById('searchUserInput').value.toLowerCase();
    const userRows = document.querySelectorAll('#usersList tr');

    userRows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        const document = row.cells[2].textContent.toLowerCase();
        const phone = row.cells[3].textContent.toLowerCase();

        if (name.includes(searchText) || document.includes(searchText) || phone.includes(searchText)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Obtener información de cumpleaños próximos
function getUpcomingBirthdayInfo(birthdate) {
    if (!birthdate) return null;

    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [year, month, day] = birthdate.split('-').map(Number);
    const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);

    if (birthdayThisYear < todayLocal) {
        birthdayThisYear.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = birthdayThisYear - todayLocal;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 3) {
        return { daysUntil: diffDays, date: birthdayThisYear };
    }

    return null;
}

// Mostrar cumpleaños
function showBirthdays(type) {
    // Esta función se implementará en utils.js
    console.log('Mostrar cumpleaños:', type);
}

// Guardar usuario editado
export function saveEditedUser() {
    const userId = document.getElementById('editUserId').value;
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return;

    // Validar teléfonos
    const phone = document.getElementById('editPhone').value;
    const emergencyPhone = document.getElementById('editEmergencyPhone').value;

    if (phone && !isValidPhone(phone)) {
        alert('El formato del teléfono principal es inválido. Debe tener 10 dígitos y comenzar con 3.');
        return;
    }

    if (emergencyPhone && !isValidPhone(emergencyPhone)) {
        alert('El formato del teléfono de emergencia es inválido. Debe tener 10 dígitos y comenzar con 3.');
        return;
    }

    // Actualizar datos del usuario
    users[userIndex] = {
        ...users[userIndex],
        name: document.getElementById('editName').value,
        document: document.getElementById('editDocument').value,
        birthdate: document.getElementById('editBirthdate').value,
        phone: document.getElementById('editPhone').value,
        eps: document.getElementById('editEps').value,
        rh: document.getElementById('editRh').value,
        pathology: document.getElementById('editPathology').value,
        emergencyContact: document.getElementById('editEmergencyContact').value,
        emergencyPhone: document.getElementById('editEmergencyPhone').value,
        classTime: document.getElementById('editClassTime').value,
        affiliationType: document.getElementById('editAffiliationType').value,
        status: document.getElementById('editStatus').value
    };

    // Guardar en localStorage
    saveUsers();

    // Recargar la lista
    loadUsers();

    // Cerrar el modal
    const editUserModal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
    editUserModal.hide();

    alert('Usuario actualizado correctamente!');
}

// Funciones para exportar al ámbito global
window.editUser = function(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Llenar el formulario de edición
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editName').value = user.name;
    document.getElementById('editDocument').value = user.document || '';
    document.getElementById('editBirthdate').value = user.birthdate || '';
    document.getElementById('editPhone').value = user.phone || '';
    document.getElementById('editEps').value = user.eps || '';
    document.getElementById('editRh').value = user.rh || '';
    document.getElementById('editPathology').value = user.pathology || '';
    document.getElementById('editEmergencyContact').value = user.emergencyContact || '';
    document.getElementById('editEmergencyPhone').value = user.emergencyPhone || '';
    document.getElementById('editClassTime').value = user.classTime || '';
    document.getElementById('editAffiliationType').value = user.affiliationType || '';
    document.getElementById('editStatus').value = user.status || 'active';

    // Mostrar el modal
    const editUserModal = new bootstrap.Modal(document.getElementById('editUserModal'));
    editUserModal.show();
};

window.showEmergencyInfo = function(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const emergencyInfoContent = document.getElementById('emergencyInfoContent');
    emergencyInfoContent.innerHTML = `
        <h6>Información de ${user.name}</h6>
        <div class="emergency-info">
            <p><strong>EPS:</strong> ${user.eps || 'No registrada'}</p>
            <p><strong>Tipo de sangre (RH):</strong> ${user.rh || 'No registrado'}</p>
            <p><strong>Patologías:</strong> ${user.pathology || 'Ninguna registrada'}</p>
            <p><strong>Contacto de emergencia:</strong> ${user.emergencyContact || 'No registrado'}</p>
            <p><strong>Teléfono de emergencia:</strong> ${user.emergencyPhone || 'No registrado'}</p>
        </div>
    `;

    const emergencyModal = new bootstrap.Modal(document.getElementById('emergencyInfoModal'));
    emergencyModal.show();
};

window.deleteUser = function(userId) {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
        users = users.filter(user => user.id !== userId);
        saveUsers();
        loadUsers();
    }
};

// Obtener todos los usuarios
export function getAllUsers() {
    return users;
}

// Obtener usuario por ID
export function getUserById(userId) {
    return users.find(u => u.id === userId);
}

// Obtener usuarios activos
export function getActiveUsers() {
    return users.filter(user => user.status === 'active');
}

// Agregar usuario (para importación)
export function addUser(user) {
    users.push(user);
    saveUsers();
    loadUsers();
}
// Recargar usuarios desde localStorage (para restauración)
export function reloadUsersFromStorage() {
    users = Storage.get(STORAGE_KEYS.USERS, []);
    loadUsers();
    updateUserSelects();
}

export function getUserMembershipInfo(userId) {
    const user = getUserById(userId);
    if (!user) return null;
    
    // Esta función se complementará con la información de pagos
    return {
        user: user,
        lastPayment: null, // Se actualizará desde income.js
        expired: false,
        daysExpired: 0,
        attendanceAfterExpiry: 0
    };
}
