class DateUtility {
  static formatToShortDate(date) {
    if (!date) return null;  // ✅ Null/undefined check
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;  // ✅ Invalid date check
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  static formatWithZeros(date) {
    if (!date) return null;
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
}

export default DateUtility;