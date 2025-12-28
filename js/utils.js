// Funciones de utilidad

// Mostrar notificación de respaldo
export function showBackupNotification(message) {
    const notification = document.getElementById('backupNotification');
    if (!notification) return;
    
    const notificationText = document.getElementById('backupNotificationText');
    if (notificationText) {
        notificationText.textContent = message;
    }
    
    notification.style.display = 'block';

    setTimeout(function () {
        notification.style.display = 'none';
    }, 5000);
}

// Exportar a Excel
export function exportToExcel(data, filename, sheetName = 'Datos') {
    try {
        // Crear libro de trabajo
        let workbook = XLSX.utils.book_new();
        
        // Convertir datos a hoja de trabajo
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        
        // Generar archivo Excel
        XLSX.writeFile(workbook, filename);
        
        return true;
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        return false;
    }
}

// Calcular días entre dos fechas
export function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Formatear número con separadores de miles
export function formatNumber(number) {
    return number.toLocaleString('es-ES');
}

// Validar correo electrónico
export function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Generar siguiente ID de usuario
export function generateNextUserId(users) {
    if (users.length === 0) return 1;
    const maxId = Math.max(...users.map(user => parseInt(user.id)));
    return maxId + 1;
}

// Validación de teléfonos
export function isValidPhone(phone) {
    if (!phone) return false;
    const cleaned = cleanPhone(phone);
    // Validar que tenga 10 dígitos y comience con 3
    return /^3\d{9}$/.test(cleaned);
}

export function cleanPhone(phone) {
    if (!phone) return '';
    return phone.toString().replace(/\D/g, '');
}

// Configurar validación de teléfonos
export function setupPhoneValidation() {
    const phoneInputs = [
        'phone',
        'emergencyPhone',
        'editPhone',
        'editEmergencyPhone',
        'whatsappNumber',
        'clientPhone'
    ];
    
    phoneInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const errorDiv = document.getElementById(`${inputId}Error`);
        
        input.addEventListener('input', function() {
            const phone = this.value;
            
            if (phone && !isValidPhone(phone)) {
                this.classList.add('validation-error');
                if (errorDiv) errorDiv.style.display = 'block';
            } else {
                this.classList.remove('validation-error');
                if (errorDiv) errorDiv.style.display = 'none';
            }
        });
    });
}

// Formatear moneda
export function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}

// Formatear fecha
export function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Ajustar por zona horaria
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Formatear fecha para WhatsApp
export function formatDateForWhatsApp(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    // Ajustar por zona horaria
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
    return date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// Filtrar lista genérica
export function filterList(items, searchText, fields) {
    if (!searchText) return items;
    
    const lowerSearch = searchText.toLowerCase();
    return items.filter(item => {
        return fields.some(field => {
            const value = item[field];
            return value && value.toString().toLowerCase().includes(lowerSearch);
        });
    });
}