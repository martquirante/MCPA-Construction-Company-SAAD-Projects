/**
 * Authoritative Philippine Holidays & Provincial Observances Engine
 * Provides official regular holidays, special non-working days, and Bulacan local festivities.
 * NOTE: Strict rule - ZERO EMOJIS. All icons and styling are handled via SVG components.
 */

export function getPhilippineHolidays(year) {
  const y = parseInt(year, 10) || new Date().getFullYear();
  const fmt = (m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return [
    // --- National Regular Holidays (100% / 200% Pay) ---
    {
      id: `ph-reg-ny-${y}`,
      title: "New Year's Day",
      date: fmt(1, 1),
      category: "holiday",
      type: "National Regular Holiday",
      siteStatus: "Site Closed · Worker Holiday Pay",
      notes: "Official nationwide non-working holiday. Heavy machinery and batching plant operations suspended.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-reg-kagitingan-${y}`,
      title: "Araw ng Kagitingan (Day of Valor)",
      date: fmt(4, 9),
      category: "holiday",
      type: "National Regular Holiday",
      siteStatus: "Operations Paused · Double Pay",
      notes: "National commemoration. On-site structural concrete pours require prior holiday work clearance.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-reg-labor-${y}`,
      title: "Labor Day",
      date: fmt(5, 1),
      category: "holiday",
      type: "National Regular Holiday",
      siteStatus: "Site Standstill · Labor Holiday Pay",
      notes: "National holiday honoring the construction workforce and labor sector.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-reg-independence-${y}`,
      title: "Philippine Independence Day",
      date: fmt(6, 12),
      category: "holiday",
      type: "National Regular Holiday",
      siteStatus: "Site Standstill · Double Pay",
      notes: "Official national holiday. Office and fabrication yards closed.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-reg-heroes-${y}`,
      title: "National Heroes Day",
      date: fmt(8, 31),
      category: "holiday",
      type: "National Regular Holiday",
      siteStatus: "Site Standstill · Double Pay",
      notes: "Official non-working holiday across Central Luzon.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-reg-bonifacio-${y}`,
      title: "Bonifacio Day",
      date: fmt(11, 30),
      category: "holiday",
      type: "National Regular Holiday",
      siteStatus: "Site Standstill · Double Pay",
      notes: "Regular non-working holiday.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-reg-xmas-${y}`,
      title: "Christmas Day",
      date: fmt(12, 25),
      category: "holiday",
      type: "National Regular Holiday",
      siteStatus: "All Construction & Site Operations Closed",
      notes: "Company-wide Christmas holiday. Site security protocols active.",
      isHoliday: true,
      priority: "high",
    },
    {
      id: `ph-reg-rizal-${y}`,
      title: "Rizal Day",
      date: fmt(12, 30),
      category: "holiday",
      type: "National Regular Holiday",
      siteStatus: "Site Standstill · Double Pay",
      notes: "National commemoration.",
      isHoliday: true,
      priority: "standard",
    },

    // --- Special Non-Working Days (130% Pay) ---
    {
      id: `ph-spe-edsa-${y}`,
      title: "EDSA People Power Revolution Anniversary",
      date: fmt(2, 25),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Optional Site Execution · Special Rate",
      notes: "Special non-working day.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-spe-ninoy-${y}`,
      title: "Ninoy Aquino Day",
      date: fmt(8, 21),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Optional Site Execution · Special Rate",
      notes: "Special non-working day.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-spe-saints-${y}`,
      title: "All Saints' Day (Undas)",
      date: fmt(11, 1),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Site Closed · Undas Observance",
      notes: "Nationwide family observance. Construction sites secured.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-spe-souls-${y}`,
      title: "All Souls' Day",
      date: fmt(11, 2),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Site Closed · Undas Observance",
      notes: "Special non-working day.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-spe-conception-${y}`,
      title: "Feast of the Immaculate Conception",
      date: fmt(12, 8),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Optional Operations · 130% Rate",
      notes: "Special non-working holiday.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-spe-xmas-eve-${y}`,
      title: "Christmas Eve",
      date: fmt(12, 24),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Half-Day Site Operations Until 12:00 PM",
      notes: "Half-day shift for site carpenters, masons, and leads.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-spe-nye-${y}`,
      title: "New Year's Eve",
      date: fmt(12, 31),
      category: "holiday",
      type: "Special Non-Working Holiday",
      siteStatus: "Half-Day Site Operations Until 12:00 PM",
      notes: "Year-end site lockdown and inventory audit.",
      isHoliday: true,
      priority: "standard",
    },

    // --- Bulacan Provincial & Municipal Observances (MCPA Hub) ---
    {
      id: `ph-loc-bulacan-day-${y}`,
      title: "Araw ng Lalawigan ng Bulacan",
      date: fmt(8, 15),
      category: "holiday",
      type: "Bulacan Provincial Holiday",
      siteStatus: "Bulacan Government Offices Closed",
      notes: "Municipal building permit and inspection offices in Malolos and Plaridel closed for provincial founding day.",
      isHoliday: true,
      priority: "standard",
    },
    {
      id: `ph-loc-singkaban-${y}`,
      title: "Singkaban Festival (Bulacan Heritage)",
      date: fmt(9, 8),
      category: "holiday",
      type: "Bulacan Cultural Observance",
      siteStatus: "Normal Operations · Heavy Provincial Logistics Advisory",
      notes: "Annual provincial festival. Cement batching and rebar delivery trucks may experience provincial route delays.",
      isHoliday: true,
      priority: "standard",
    },
  ];
}

/**
 * Computes bi-monthly company payroll dates for a given month and year
 */
export function getCompanyPayrollDates(year, month) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10); // 1-12
  const fmt = (d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // 15th of the month
  const midMonth = {
    id: `payroll-${y}-${m}-15`,
    title: "MCPA Worker & Staff Payroll (Mid-Month)",
    date: fmt(15),
    time: "10:00 AM",
    category: "billing",
    type: "Company Payroll",
    priority: "high",
    isPayroll: true,
    notes: "Bi-monthly release of wages for site carpenters, steelmen, masons, and project engineers.",
  };

  // Last day of the month
  const lastDayNum = new Date(y, m, 0).getDate();
  const endMonth = {
    id: `payroll-${y}-${m}-${lastDayNum}`,
    title: "MCPA Worker & Staff Payroll (End-Month)",
    date: fmt(lastDayNum),
    time: "10:00 AM",
    category: "billing",
    type: "Company Payroll",
    priority: "high",
    isPayroll: true,
    notes: "End-of-month wage settlement and subcontractor accomplishment verification.",
  };

  return [midMonth, endMonth];
}
