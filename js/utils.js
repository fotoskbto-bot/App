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
    try {
        const date = new Date(dateString);
        // Ajustar por zona horaria
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formateando fecha:', dateString, error);
        return '';
    }
}

// Formatear fecha para WhatsApp
export function formatDateForWhatsApp(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        // Ajustar por zona horaria
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
        return date.toLocaleDateString('es-CO', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formateando fecha para WhatsApp:', dateString, error);
        return '';
    }
}

// Formatear fecha para Excel (formato dd/mm/aaaa)
export function formatDateForExcel(dateString) {
    if (!dateString) return '';
    
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formateando fecha para Excel:', dateString, error);
        return '';
    }
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

// Convertir fecha de Excel a formato ISO
export function excelDateToISO(excelDate) {
    try {
        if (!excelDate) return '';
        
        // Si ya es un string con formato de fecha
        if (typeof excelDate === 'string') {
            // Intentar parsear como fecha directamente
            const date = new Date(excelDate);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
            
            // Si es formato dd/mm/aaaa
            if (excelDate.includes('/')) {
                const parts = excelDate.split('/');
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
                    return `${year}-${month}-${day}`;
                }
            }
            
            // Si es formato mm/dd/aaaa
            if (excelDate.includes('-')) {
                const parts = excelDate.split('-');
                if (parts.length === 3) {
                    // Verificar si el primer elemento es año (4 dígitos)
                    if (parts[0].length === 4) {
                        // Formato YYYY-MM-DD
                        return excelDate;
                    } else {
                        // Formato MM-DD-YYYY o DD-MM-YYYY
                        // Intentar determinar el formato
                        if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
                            // Si el primer número es mayor a 12, probablemente es día
                            if (parseInt(parts[0]) > 12) {
                                // Formato DD-MM-YYYY
                                const day = parts[0].padStart(2, '0');
                                const month = parts[1].padStart(2, '0');
                                const year = parts[2];
                                return `${year}-${month}-${day}`;
                            } else {
                                // Formato MM-DD-YYYY
                                const month = parts[0].padStart(2, '0');
                                const day = parts[1].padStart(2, '0');
                                const year = parts[2];
                                return `${year}-${month}-${day}`;
                            }
                        }
                    }
                }
            }
            
            // Si es formato aaaa/mm/dd
            if (excelDate.includes('/') && excelDate.split('/')[0].length === 4) {
                const parts = excelDate.split('/');
                if (parts.length === 3) {
                    const year = parts[0];
                    const month = parts[1].padStart(2, '0');
                    const day = parts[2].padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            }
        }
        
        // Si es un número (fecha serial de Excel)
        if (typeof excelDate === 'number') {
            // Excel usa un sistema donde 1 = 1 de enero de 1900
            const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
            const date = new Date(excelEpoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
            return date.toISOString().split('T')[0];
        }
        
        // Si es un objeto Date
        if (excelDate instanceof Date) {
            return excelDate.toISOString().split('T')[0];
        }
        
        return '';
    } catch (error) {
        console.error('Error convirtiendo fecha de Excel:', excelDate, error);
        return '';
    }
}

// Convertir cualquier fecha a formato ISO
export function normalizeDate(dateValue) {
    try {
        if (!dateValue) return '';
        
        // Si ya está en formato ISO
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }
        
        // Si es una fecha válida pero en otro formato
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        
        // Usar la función de conversión de Excel
        return excelDateToISO(dateValue);
    } catch (error) {
        console.error('Error normalizando fecha:', dateValue, error);
        return '';
    }
}

// Limpiar y validar datos restaurados
export function cleanRestoredData(data, type) {
    if (!Array.isArray(data)) return [];
    
    return data.map(item => {
        if (!item) return item;
        
        // Para usuarios
        if (type === 'users') {
            return {
                ...item,
                id: item.id || item.ID || Date.now() + Math.random(),
                name: item.name || item.Nombre || '',
                document: item.document || item.Documento || '',
                birthdate: normalizeDate(item.birthdate || item['Fecha Nacimiento']),
                phone: item.phone || item.Telefono || '',
                eps: item.eps || item.EPS || '',
                rh: item.rh || item.RH || '',
                pathology: item.pathology || item.Patologia || '',
                emergencyContact: item.emergencyContact || item['Contacto Emergencia'] || '',
                emergencyPhone: item.emergencyPhone || item['Telefono Emergencia'] || '',
                classTime: item.classTime || item.Clase || '',
                affiliationType: item.affiliationType || item['Tipo Afiliacion'] || '',
                status: (item.status || item.Estado || 'active').toLowerCase(),
                createdAt: normalizeDate(item.createdAt || item['Fecha Registro']) || new Date().toISOString()
            };
        }
        
        // Para asistencias
        if (type === 'attendance') {
            return {
                ...item,
                id: item.id || item.ID || Date.now() + Math.random(),
                userId: item.userId || item.UsuarioID || '',
                date: normalizeDate(item.date || item.Fecha),
                status: (item.status || item.Estado || 'presente').toLowerCase(),
                registeredAt: normalizeDate(item.registeredAt || item['Fecha Registro']) || new Date().toISOString()
            };
        }
        
        // Para pagos
        if (type === 'income') {
            return {
                ...item,
                id: item.id || item.ID || Date.now() + Math.random(),
                userId: item.userId || item.UsuarioID || '',
                paymentDate: normalizeDate(item.paymentDate || item['Fecha Pago']),
                startDate: normalizeDate(item.startDate || item['Fecha Inicio']),
                endDate: normalizeDate(item.endDate || item['Fecha Fin']),
                paymentType: item.paymentType || item['Tipo Pago'] || '',
                amount: parseFloat(item.amount || item.Monto || 0),
                description: item.description || item.Descripción || '',
                registeredAt: normalizeDate(item.registeredAt || item['Fecha Registro']) || new Date().toISOString()
            };
        }
        
        return item;
    });
}
