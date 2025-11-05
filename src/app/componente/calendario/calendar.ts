import {ChangeDetectorRef, Component, EventEmitter, HostListener, inject, OnInit, Output} from '@angular/core';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.html',
  standalone: true,
  imports: [
    DatePipe
  ],
  styleUrls: ['./calendar.css']
})
export class CalendarComponent implements OnInit {
  cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  constructor() { }
  @Output() dateSelected = new EventEmitter<{start: Date, end?: Date}>();
  today = new Date();
  viewYear = this.today.getFullYear();
  viewMonth = this.today.getMonth();

  selectedStartDate: Date | null = null;
  selectedEndDate: Date | null = null;
  isDragging = false;
  hoverDate: Date | null = null;

  showMonthPicker = false;
  showYearPicker = false;

  months = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ];

  weeks: any[] = [];

  ngOnInit() {
    this.generateCalendar(this.viewYear, this.viewMonth);
    this.cdr.detectChanges();
  }

  generateCalendar(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    const firstDayWeek = firstDay.getDay(); // 0=Domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const prevMonthDays = firstDayWeek;
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const totalCells = Math.ceil((prevMonthDays + daysInMonth) / 7) * 7;

    const cells = [];
    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - prevMonthDays + 1;
      let date: Date;
      let inMonth = true;

      if (dayNumber <= 0) {
        date = new Date(year, month - 1, daysInPrevMonth + dayNumber);
        inMonth = false;
      } else if (dayNumber > daysInMonth) {
        date = new Date(year, month + 1, dayNumber - daysInMonth);
        inMonth = false;
      } else {
        date = new Date(year, month, dayNumber);
      }

      cells.push({ day: date.getDate(), date, inMonth });
    }

    this.weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      this.weeks.push(cells.slice(i, i + 7));
    }
  }

  prevMonth() {
    if (this.viewMonth === 0) {
      this.viewMonth = 11;
      this.viewYear--;
    } else this.viewMonth--;
    this.generateCalendar(this.viewYear, this.viewMonth);
  }

  nextMonth() {
    if (this.viewMonth === 11) {
      this.viewMonth = 0;
      this.viewYear++;
    } else this.viewMonth++;
    this.generateCalendar(this.viewYear, this.viewMonth);
  }

  goToToday() {
    this.viewYear = this.today.getFullYear();
    this.viewMonth = this.today.getMonth();
    this.generateCalendar(this.viewYear, this.viewMonth);
  }

  // --- Selección de rango ---
  startRange(date: Date) {
    this.isDragging = true;
    this.selectedStartDate = date;
    this.selectedEndDate = null;
  }

  hoverRange(date: Date) {
    if (this.isDragging && this.selectedStartDate) {
      this.hoverDate = date;
    }
  }

  endRange(date: Date) {
    if (!this.selectedStartDate || (this.selectedStartDate && this.selectedEndDate)) {
      this.selectedStartDate = date;
      this.selectedEndDate = null;
      this.emitSelectedDate();
      return;
    }
    this.selectedEndDate = date;

    // Asegurar orden correcto
    if (this.selectedStartDate > this.selectedEndDate) {
      [this.selectedStartDate, this.selectedEndDate] = [this.selectedEndDate, this.selectedStartDate];
    }
    this.emitSelectedDate();
  }

  isInRange(date: Date): boolean {
    if (!this.selectedStartDate || !this.selectedEndDate) return false;
    return date >= this.selectedStartDate && date <= this.selectedEndDate;
  }

  isSelected(date: Date): boolean {
    return !!(
      (this.selectedStartDate && this.sameDate(date, this.selectedStartDate)) ||
      (this.selectedEndDate && this.sameDate(date, this.selectedEndDate))
    );
  }

  sameDate(a: Date, b: Date): boolean {
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  }

  isToday(date: Date): boolean {
    return this.sameDate(date, this.today);
  }

  toggleMonthPicker() { this.showMonthPicker = !this.showMonthPicker; this.showYearPicker = false; }
  toggleYearPicker() { this.showYearPicker = !this.showYearPicker; this.showMonthPicker = false; }

  pickMonth(month: number) {
    this.viewMonth = month;
    this.showMonthPicker = false;
    this.generateCalendar(this.viewYear, this.viewMonth);
    this.cdr.detectChanges();
  }

  pickYear(year: number) {
    this.viewYear = year;
    this.showYearPicker = false;
    this.generateCalendar(this.viewYear, this.viewMonth);
    this.cdr.detectChanges();
  }

  getYearRange(): number[] {
    const start = this.viewYear - 6;
    return Array.from({ length: 12 }, (_, i) => start + i);
  }

  @HostListener('document:mouseup')
  stopDragging() {
    this.isDragging = false;
  }
  trackByIndex(index: number): number {
    return index;
  }

  trackByDate(index: number, item: any): string {
    return item.date.toISOString();
  }

  emitSelectedDate() {
    this.dateSelected.emit({
      start: this.selectedStartDate!,
      end: this.selectedEndDate ?? undefined
    });
  }
}
