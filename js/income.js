import { Storage, STORAGE_KEYS } from './storage.js';
import { formatCurrency, isValidPhone, cleanPhone, formatDateForWhatsApp } from './utils.js';
import { getActiveUsers, getUserById } from './users.js';

// Variables locales
let income = [];
let pendingPaymentData = null;

// Inicializar ingresos
export function initIncome() {
    console.log("Inicializando módulo de ingresos...");
    
    // Cargar ingresos desde localStorage
    income = Storage.get(STORAGE_KEYS.INCOME, []);
    console.log(`${income.length} ingresos cargados desde localStorage`);
    
    // Configurar event listeners
    setupIncomeEventListeners();
    
    // Cargar ingresos iniciales
    loadIncome();
    loadUserSelects();
}

// Configurar event listeners para ingresos
function setupIncomeEventListeners() {
    // Formulario de ingresos
    const incomeForm = document.getElementById('incomeForm');
    if (incomeForm) {
        incomeForm.addEventListener('submit', handleIncomeFormSubmit);
    }
    
    // Botón de filtrar
    const filterIncomeBtn = document.getElementById('filterIncomeBtn');
    if (filterIncomeBtn) {
        filterIncomeBtn.addEventListener('click', loadIncome);
    }
    
    // Buscador en tabla de ingresos
    const incomeTableSearch = document.getElementById('incomeTableSearch');
    if (incomeTableSearch) {
        incomeTableSearch.addEventListener('input', filterIncomeTable);
    }
    
    // Configurar búsqueda en tiempo real para el select de pagos
    setupUserSearch();
    
    // Configurar envío de confirmación de pago
    const sendConfirmationBtn = document.getElementById('sendConfirmationBtn');
    if (sendConfirmationBtn) {
        sendConfirmationBtn.addEventListener('click', sendPaymentConfirmation);
    }
    
    // Evento para modal de confirmación de pago
    const paymentConfirmationModal = document.getElementById('paymentConfirmationModal');
    if (paymentConfirmationModal) {
        paymentConfirmationModal.addEventListener('hidden.bs.modal', function () {
            if (pendingPaymentData) {
                if (confirm('¿Desea registrar el pago sin enviar el mensaje de WhatsApp?')) {
                    addIncomeRecord(pendingPaymentData);
                    document.getElementById('incomeForm').reset();
                    pendingPaymentData = null;
                }
            }
        });
    }
}

// Configurar búsqueda en tiempo real en pagos
function setupUserSearch() {
    const incomeUserSearch = document.getElementById('incomeUserSearch');
    const incomeUserSelect = document.getElementById('incomeUserSelect');
    
    if (incomeUserSearch && incomeUserSelect) {
        incomeUserSearch.addEventListener('input', function () {
            const searchText = this.value.toLowerCase();
            const options = incomeUserSelect.options;
            
            for (let i = 0; i < options.length; i++) {
                const option = options[i];
                if (option.textContent.toLowerCase().includes(searchText)) {
                    option.style.display = '';
                } else {
                    option.style.display = 'none';
                }
            }
        });
    }
}

// Manejar envío del formulario de ingresos
function handleIncomeFormSubmit(e) {
    e.preventDefault();

    // Recoger los datos del formulario pero no guardarlos todavía
    pendingPaymentData = {
        id: Date.now(),
        userId: document.getElementById('incomeUserSelect').value,
        paymentDate: new Date().toISOString().split('T')[0],
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        paymentType: document.getElementById('paymentType').value,
        amount: parseFloat(document.getElementById('amount').value).toFixed(2),
        description: document.getElementById('description').value,
        registeredAt: new Date().toISOString()
    };

    // Validar que se haya seleccionado un usuario
    if (!pendingPaymentData.userId) {
        alert('Por favor, seleccione un usuario.');
        return;
    }

    // Mostrar modal de confirmación
    const paymentModal = new bootstrap.Modal(document.getElementById('paymentConfirmationModal'));
    paymentModal.show();
}

// Enviar confirmación de pago por WhatsApp
function sendPaymentConfirmation() {
    if (!pendingPaymentData) {
        alert('No hay datos de pago pendientes.');
        return;
    }

    // Registrar el pago
    addIncomeRecord(pendingPaymentData);

    // Obtener el usuario para el mensaje de WhatsApp
    const selectedUser = getUserById(pendingPaymentData.userId);

    if (selectedUser) {
        // Validar teléfono
        if (!isValidPhone(selectedUser.phone)) {
            alert('No se puede enviar el mensaje porque el usuario no tiene un número de teléfono válido.');
            
            // Cerrar modal de confirmación
            const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentConfirmationModal'));
            if (paymentModal) {
                paymentModal.hide();
            }
            
            // Resetear el formulario
            document.getElementById('incomeForm').reset();
            
            pendingPaymentData = null;
            return;
        }

        // Formatear monto sin decimales
        const amountFormatted = parseInt(pendingPaymentData.amount).toLocaleString('es-ES');
        
        // Corregir fecha
        const endDateFormatted = formatDateForWhatsApp(pendingPaymentData.endDate);
        
        // Preparar mensaje de WhatsApp
        const message = `Hola ${selectedUser.name}, tu pago en Antologia Box23 por un valor de $${amountFormatted} por ${pendingPaymentData.paymentType} ha sido registrado exitosamente. Tu membresía es válida hasta el ${endDateFormatted}. ¡Gracias por confiar en Antología Box23!`;

        // Rellenar el formulario de WhatsApp
        document.getElementById('whatsappNumber').value = cleanPhone(selectedUser.phone);
        document.getElementById('whatsappMessage').value = message;
        document.getElementById('messagePreview').textContent = message;

        // Actualizar enlace de WhatsApp
        updateWhatsAppLink();

        // Cerrar modal de confirmación
        const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentConfirmationModal'));
        if (paymentModal) {
            paymentModal.hide();
        }

        // Mostrar modal de WhatsApp
        const whatsappModal = new bootstrap.Modal(document.getElementById('whatsappModal'));
        whatsappModal.show();
    } else {
        alert('No se puede enviar el mensaje porque no se encontró el usuario seleccionado.');
    }

    // Resetear el formulario
    document.getElementById('incomeForm').reset();

    // Restablecer fechas por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').value = today;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];

    // Limpiar datos pendientes
    pendingPaymentData = null;
}

// Actualizar enlace de WhatsApp
function updateWhatsAppLink() {
    const phone = cleanPhone(document.getElementById('whatsappNumber').value);
    const message = document.getElementById('whatsappMessage').value;

    if (phone && message) {
        const encodedMessage = encodeURIComponent(message);
        document.getElementById('whatsappLink').href = `https://wa.me/57${phone}?text=${encodedMessage}`;
    }
}

// Cargar lista de pagos
export function loadIncome() {
    const incomeList = document.getElementById('incomeList');
    if (!incomeList) return;
    
    incomeList.innerHTML = '';
    
    const startDate = document.getElementById('incomeStartDateFilter').value;
    const endDate = document.getElementById('incomeEndDateFilter').value;
    const userId = document.getElementById('incomeFilterUser').value;

    let filteredIncome = income;
    let total = 0;

    // Filtrar por fecha
    if (startDate && endDate) {
        filteredIncome = filteredIncome.filter(i => i.paymentDate >= startDate && i.paymentDate <= endDate);
    }

    // Filtrar por usuario
    if (userId) {
        filteredIncome = filteredIncome.filter(i => i.userId == userId);
    }

    // Obtener usuarios para mostrar nombres
    const users = getActiveUsers();

    filteredIncome.forEach(record => {
        const user = getUserById(record.userId) || { name: 'Usuario eliminado' };
        const amount = parseFloat(record.amount);
        total += amount;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${record.paymentDate}</td>
            <td>${user.name}</td>
            <td>${formatCurrency(amount)}</td>
            <td>${record.paymentType || '-'}</td>
            <td>${record.endDate}</td>
            <td>${record.description || '-'}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteIncome(${record.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        incomeList.appendChild(row);
    });

    // Actualizar total
    const incomeTotal = document.getElementById('incomeTotal');
    if (incomeTotal) {
        incomeTotal.textContent = formatCurrency(total);
    }

    // Verificar estado de membresía
    checkMembershipStatus();
}

// Eliminar registro de pago
window.deleteIncome = function(incomeId) {
    if (confirm('¿Está seguro de que desea eliminar este registro de pago?')) {
        income = income.filter(i => i.id !== incomeId);
        Storage.set(STORAGE_KEYS.INCOME, income);
        loadIncome();
        alert('Registro de pago eliminado correctamente.');
    }
};

// Filtrar tabla de pagos
function filterIncomeTable() {
    const searchText = document.getElementById('incomeTableSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#incomeTable tbody tr');
    
    rows.forEach(row => {
        const userName = row.cells[1].textContent.toLowerCase();
        const paymentType = row.cells[3].textContent.toLowerCase();
        const description = row.cells[5].textContent.toLowerCase();
        
        if (userName.includes(searchText) || paymentType.includes(searchText) || description.includes(searchText)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Verificar estado de membresía
function checkMembershipStatus() {
    const filterUser = document.getElementById('incomeFilterUser').value;

    if (!filterUser) {
        const packageWarning = document.getElementById('packageWarning');
        if (packageWarning) {
            packageWarning.classList.add('d-none');
        }
        return;
    }

    const user = getUserById(filterUser);
    if (!user) {
        const packageWarning = document.getElementById('packageWarning');
        if (packageWarning) {
            packageWarning.classList.add('d-none');
        }
        return;
    }

    // Implementar lógica de verificación de membresía aquí
    const warningText = document.getElementById('warningText');
    const packageWarning = document.getElementById('packageWarning');
    
    if (warningText && packageWarning) {
        warningText.textContent = `Verificando estado de membresía para ${user.name}...`;
        packageWarning.classList.remove('d-none');
    }
}

// Cargar selects de usuario
function loadUserSelects() {
    const userSelect = document.getElementById('incomeUserSelect');
    const incomeFilterUser = document.getElementById('incomeFilterUser');

    // Limpiar selects
    if (userSelect) {
        userSelect.innerHTML = '<option value="">Seleccionar usuario</option>';
    }
    
    if (incomeFilterUser) {
        incomeFilterUser.innerHTML = '<option value="">Todos los usuarios</option>';
    }

    // Llenar con usuarios activos
    const users = getActiveUsers();
    users.forEach(user => {
        if (user.status !== 'inactive') {
            // Para el select de pagos
            if (userSelect) {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.name} - ${user.classTime} - ${user.document || 'Sin documento'}`;
                userSelect.appendChild(option);
            }

            // Para filtros
            if (incomeFilterUser) {
                const filterOption = document.createElement('option');
                filterOption.value = user.id;
                filterOption.textContent = user.name;
                incomeFilterUser.appendChild(filterOption);
            }
        }
    });
}

// Obtener todos los ingresos
export function getAllIncome() {
    return income;
}

// Obtener ingresos por usuario
export function getIncomeByUserId(userId) {
    return income.filter(i => i.userId == userId);
}

// Agregar registro de ingreso
function addIncomeRecord(record) {
    income.push(record);
    const saved = Storage.set(STORAGE_KEYS.INCOME, income);
    
    if (saved) {
        console.log("Pago registrado correctamente");
    }
    
    loadIncome();
}

// Recargar ingresos desde localStorage (para restauración)
export function reloadIncomeFromStorage() {
    income = Storage.get(STORAGE_KEYS.INCOME, []);
    loadIncome();
}

// Exponer función globalmente
window.loadIncome = loadIncome;