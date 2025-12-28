// membership.js
import { Storage, STORAGE_KEYS } from './storage.js';
import { getAllIncome } from './income.js';
import { getAllAttendance } from './attendance.js';
import { formatDate } from './utils.js';

// Obtener información completa de membresía para un usuario
export function getMembershipStatus(userId) {
    const income = getAllIncome();
    const attendance = getAllAttendance();
    
    // Obtener el último pago del usuario
    const userPayments = income.filter(p => p.userId == userId);
    if (userPayments.length === 0) {
        return {
            hasMembership: false,
            status: 'Sin pago',
            endDate: null,
            expired: true,
            daysExpired: 999,
            attendanceAfterExpiry: 0,
            paymentType: 'Ninguno'
        };
    }
    
    // Ordenar por fecha de pago descendente
    userPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    const lastPayment = userPayments[0];
    
    // Calcular días de vencimiento
    const today = new Date();
    const endDate = new Date(lastPayment.endDate);
    const daysExpired = Math.max(0, Math.floor((today - endDate) / (1000 * 60 * 60 * 24)));
    
    // Contar asistencias después del vencimiento
    const attendanceAfterExpiry = attendance.filter(a => 
        a.userId == userId && 
        a.status === 'presente' &&
        new Date(a.date) > endDate
    ).length;
    
    // Determinar estado
    let status = '';
    let expired = false;
    
    if (daysExpired > 0) {
        status = `Vencida hace ${daysExpired} días`;
        expired = true;
    } else if (daysExpired === 0) {
        status = 'Vence hoy';
        expired = true;
    } else {
        const daysLeft = Math.abs(daysExpired);
        status = daysLeft <= 3 ? `Vence en ${daysLeft} días` : 'Vigente';
        expired = false;
    }
    
    return {
        hasMembership: true,
        status: status,
        endDate: lastPayment.endDate,
        formattedEndDate: formatDate(lastPayment.endDate),
        expired: expired,
        daysExpired: daysExpired,
        attendanceAfterExpiry: attendanceAfterExpiry,
        paymentType: lastPayment.paymentType || 'Sin tipo'
    };
}

// Obtener información resumida para mostrar en lista de asistencia
export function getMembershipSummary(userId) {
    const status = getMembershipStatus(userId);
    
    if (!status.hasMembership) {
        return '<span class="badge bg-danger">Sin membresía</span>';
    }
    
    let badgeClass = 'bg-success';
    if (status.expired) {
        badgeClass = status.daysExpired <= 7 ? 'bg-warning' : 'bg-danger';
    } else if (status.status.includes('Vence en')) {
        badgeClass = 'bg-warning';
    }
    
    let html = `<span class="badge ${badgeClass}">${status.status}</span>`;
    
    if (status.attendanceAfterExpiry > 0) {
        html += ` <span class="badge bg-danger" title="Clases asistidas después del vencimiento">+${status.attendanceAfterExpiry}</span>`;
    }
    
    return html;
}
