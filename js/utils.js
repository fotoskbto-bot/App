// utils.js - Funciones de utilidad mejoradas para manejo de fechas

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

// NUEVA: Función auxiliar para parsear fecha en formato DD/MM/YYYY
function parseDDMMYYYY(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Meses en JS van de 0 a 11
        let year = parseInt(parts[2], 10);
        
        // Manejar años de 2 dígitos
        if (year < 100) {
            year = 2000 + year;
        }
        
        // Validar valores
        if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
            return new Date(year, month, day);
        }
    }
    return null;
}

// NUEVA: Función auxiliar para parsear fecha en formato MM/DD/YYYY
function parseMMDDYYYY(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        let year = parseInt(parts[2], 10);
        
        // Manejar años de 2 dígitos
        if (year < 100) {
            year = 2000 + year;
        }
        
        // Validar valores
        if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
            return new Date(year, month, day);
        }
    }
    return null;
}

// NUEVA: Función auxiliar para parsear fecha en formato YYYY/MM/DD
function parseYYYYMMDD(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        
        // Manejar años de 2 dígitos
        const fullYear = year < 100 ? 2000 + year : year;
        
        // Validar valores
        if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
            return new Date(fullYear, month, day);
        }
    }
    return null;
}

// NUEVA: Función auxiliar para convertir número de serie de Excel a fecha
function excelSerialToDate(serial) {
    // Excel para Windows: 1 = 1 de enero de 1900
    // Excel para Mac: 1 = 1 de enero de 1904
    // Vamos a manejar Windows (más común)
    
    const excelEpoch = new Date(1899, 11, 30); // 30 de diciembre de 1899
    const date = new Date(excelEpoch.getTime() + (serial - 1) * 24 * 60 * 60 * 1000);
    
    // Ajustar por error de Excel (considera 1900 como año bisiesto)
    if (serial > 60) {
        date.setDate(date.getDate() - 1);
    }
    
    return date;
}

// MEJORADA: Función para convertir fechas de Excel a ISO
export function excelDateToISO(excelDate) {
    try {
        if (excelDate === null || excelDate === undefined || excelDate === '') {
            return '';
        }
        
        // Si ya es un string en formato ISO (YYYY-MM-DD)
        if (typeof excelDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(excelDate)) {
            return excelDate;
        }
        
        // Si es un número (fecha serial de Excel)
        if (typeof excelDate === 'number') {
            const date = excelSerialToDate(excelDate);
            if (date && !isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
            return '';
        }
        
        // Si es un objeto Date
        if (excelDate instanceof Date) {
            if (isNaN(excelDate.getTime())) return '';
            return excelDate.toISOString().split('T')[0];
        }
        
        // Si es string
        if (typeof excelDate === 'string') {
            const str = excelDate.toString().trim();
            if (str === '') return '';
            
            // Intentar varios formatos conocidos
            
            // 1. Formato ISO (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
                return str;
            }
            
            // 2. Formato DD/MM/YYYY (más común en español)
            if (str.includes('/')) {
                // Intentar como DD/MM/YYYY
                let date = parseDDMMYYYY(str);
                if (date && !isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
                
                // Intentar como MM/DD/YYYY
                date = parseMMDDYYYY(str);
                if (date && !isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
                
                // Intentar como YYYY/MM/DD
                date = parseYYYYMMDD(str);
                if (date && !isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
            
            // 3. Formato con guiones (DD-MM-YYYY o YYYY-MM-DD)
            if (str.includes('-') && !/^\d{4}-\d{2}-\d{2}$/.test(str)) {
                // Reemplazar guiones por slashes y tratar como formato de fecha
                const withSlashes = str.replace(/-/g, '/');
                
                let date = parseDDMMYYYY(withSlashes);
                if (date && !isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
                
                date = parseMMDDYYYY(withSlashes);
                if (date && !isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
            }
            
            // 4. Intentar parsear como fecha estándar de JavaScript
            const jsDate = new Date(str);
            if (!isNaN(jsDate.getTime())) {
                return jsDate.toISOString().split('T')[0];
            }
        }
        
        console.warn('No se pudo convertir la fecha:', excelDate);
        return '';
    } catch (error) {
        console.error('Error convirtiendo fecha de Excel:', excelDate, error);
        return '';
    }
}

// MEJORADA: Función para normalizar cualquier fecha a formato ISO
export function normalizeDate(dateValue) {
    try {
        if (!dateValue) return '';
        
        // Si ya es un string en formato ISO
        if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
        }
        
        // Si es un objeto Date válido
        if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
            return dateValue.toISOString().split('T')[0];
        }
        
        // Si es un número (posible serial de Excel)
        if (typeof dateValue === 'number') {
            const isoDate = excelDateToISO(dateValue);
            if (isoDate) return isoDate;
        }
        
        // Si es un string, intentar varios enfoques
        if (typeof dateValue === 'string') {
            const str = dateValue.toString().trim();
            
            // Intento 1: Convertir desde Excel
            const excelDate = excelDateToISO(str);
            if (excelDate) {
                return excelDate;
            }
            
            // Intento 2: Parsear como fecha de JavaScript
            const jsDate = new Date(str);
            if (!isNaN(jsDate.getTime())) {
                return jsDate.toISOString().split('T')[0];
            }
        }
        
        // Último recurso: intentar convertir cualquier cosa
        return excelDateToISO(dateValue);
    } catch (error) {
        console.error('Error normalizando fecha:', dateValue, error);
        return '';
    }
}

// MEJORADA: Función para formatear fecha para Excel
export function formatDateForExcel(dateString) {
    if (!dateString) return '';
    
    try {
        // Normalizar la fecha primero
        const isoDate = normalizeDate(dateString);
        if (!isoDate) return '';
        
        // Extraer partes de la fecha ISO
        const [year, month, day] = isoDate.split('-');
        
        // Retornar en formato DD/MM/YYYY (formato español común)
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formateando fecha para Excel:', dateString, error);
        return '';
    }
}

// MEJORADA: Función para formatear fecha (sin problemas de zona horaria)
export function formatDate(dateString) {
    if (!dateString) return '';
    
    try {
        // Normalizar la fecha primero
        const isoDate = normalizeDate(dateString);
        if (!isoDate) return '';
        
        // Extraer partes
        const [year, month, day] = isoDate.split('-');
        
        // Retornar en formato DD/MM/YYYY
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formateando fecha:', dateString, error);
        return '';
    }
}

// MEJORADA: Función para formatear fecha para WhatsApp
export function formatDateForWhatsApp(dateString) {
    if (!dateString) return '';
    
    try {
        // Normalizar la fecha primero
        const isoDate = normalizeDate(dateString);
        if (!isoDate) return '';
        
        const date = new Date(isoDate);
        if (isNaN(date.getTime())) return '';
        
        // Nombres de los meses en español
        const months = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ];
        
        const day = date.getDate();
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${day} de ${monthName} de ${year}`;
    } catch (error) {
        console.error('Error formateando fecha para WhatsApp:', dateString, error);
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

// Limpiar y validar datos restaurados
export function cleanRestoredData(data, type) {
    if (!Array.isArray(data)) return [];
    
    console.log(`Limpieza de datos ${type}: ${data.length} registros`);
    
    const cleanedData = data.map((item, index) => {
        try {
            if (!item) {
                console.warn(`Registro ${index} en ${type} es nulo, se omitirá`);
                return null;
            }
            
            // Para usuarios
            if (type === 'users') {
                const cleaned = {
                    id: item.id || item.ID || item.id || Date.now() + Math.random(),
                    name: item.name || item.Nombre || item.name || '',
                    document: item.document || item.Documento || item.document || '',
                    birthdate: normalizeDate(item.birthdate || item['Fecha Nacimiento'] || item.birthdate || item['FechaNacimiento']),
                    phone: item.phone || item.Telefono || item.phone || '',
                    eps: item.eps || item.EPS || item.eps || '',
                    rh: item.rh || item.RH || item.rh || '',
                    pathology: item.pathology || item.Patologia || item.pathology || '',
                    emergencyContact: item.emergencyContact || item['Contacto Emergencia'] || item.emergencyContact || item['ContactoEmergencia'] || '',
                    emergencyPhone: item.emergencyPhone || item['Telefono Emergencia'] || item.emergencyPhone || item['TelefonoEmergencia'] || '',
                    classTime: item.classTime || item.Clase || item.classTime || '',
                    affiliationType: item.affiliationType || item['Tipo Afiliacion'] || item.affiliationType || item['TipoAfiliacion'] || '',
                    status: (item.status || item.Estado || item.status || 'active').toLowerCase(),
                    createdAt: normalizeDate(item.createdAt || item['Fecha Registro'] || item.createdAt || item['FechaRegistro']) || new Date().toISOString()
                };
                
                // Validar datos críticos
                if (!cleaned.name || cleaned.name.trim() === '') {
                    console.warn(`Usuario ${index} sin nombre, se asignará nombre genérico`);
                    cleaned.name = `Usuario ${cleaned.id}`;
                }
                
                return cleaned;
            }
            
            // Para asistencias
            if (type === 'attendance') {
                const cleaned = {
                    id: item.id || item.ID || item.id || Date.now() + Math.random(),
                    userId: item.userId || item.UsuarioID || item.userId || '',
                    date: normalizeDate(item.date || item.Fecha || item.date),
                    status: (item.status || item.Estado || item.status || 'presente').toLowerCase(),
                    registeredAt: normalizeDate(item.registeredAt || item['Fecha Registro'] || item.registeredAt || item['FechaRegistro']) || new Date().toISOString()
                };
                
                // Validar datos críticos
                if (!cleaned.userId) {
                    console.warn(`Asistencia ${index} sin userId, se omitirá`);
                    return null;
                }
                
                if (!cleaned.date) {
                    console.warn(`Asistencia ${index} sin fecha, se usará fecha actual`);
                    cleaned.date = new Date().toISOString().split('T')[0];
                }
                
                return cleaned;
            }
            
            // Para pagos
            if (type === 'income') {
                const cleaned = {
                    id: item.id || item.ID || item.id || Date.now() + Math.random(),
                    userId: item.userId || item.UsuarioID || item.userId || '',
                    paymentDate: normalizeDate(item.paymentDate || item['Fecha Pago'] || item.paymentDate || item['FechaPago']),
                    startDate: normalizeDate(item.startDate || item['Fecha Inicio'] || item.startDate || item['FechaInicio']),
                    endDate: normalizeDate(item.endDate || item['Fecha Fin'] || item.endDate || item['FechaFin']),
                    paymentType: item.paymentType || item['Tipo Pago'] || item.paymentType || item['TipoPago'] || '',
                    amount: parseFloat(item.amount || item.Monto || item.amount || 0),
                    description: item.description || item.Descripción || item.description || '',
                    registeredAt: normalizeDate(item.registeredAt || item['Fecha Registro'] || item.registeredAt || item['FechaRegistro']) || new Date().toISOString()
                };
                
                // Validar datos críticos
                if (!cleaned.userId) {
                    console.warn(`Pago ${index} sin userId, se omitirá`);
                    return null;
                }
                
                if (isNaN(cleaned.amount) || cleaned.amount <= 0) {
                    console.warn(`Pago ${index} tiene monto inválido: ${cleaned.amount}`);
                    cleaned.amount = 0;
                }
                
                return cleaned;
            }
            
            console.warn(`Tipo de dato desconocido: ${type}, registro ${index} se omitirá`);
            return null;
            
        } catch (error) {
            console.error(`Error limpiando registro ${index} de tipo ${type}:`, error, item);
            return null;
        }
    });
    
    // Filtrar registros nulos
    const filteredData = cleanedData.filter(item => item !== null);
    
    console.log(`Datos ${type} después de limpiar: ${filteredData.length} registros válidos de ${data.length} originales`);
    
    return filteredData;
}
