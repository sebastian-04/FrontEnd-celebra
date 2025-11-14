import {AfterViewInit, Component, ElementRef, HostListener, inject, signal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import * as L from 'leaflet';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterLink} from '@angular/router';
@Component({
  selector: 'app-landing',
  imports: [
    NgOptimizedImage,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements AfterViewInit {
  landingForm: FormGroup;
  private lf :FormBuilder = inject(FormBuilder);
  constructor() {
    this.landingForm = this.lf.group({
      TipoDeEvento: ['', Validators.required],
      Ubicacion: ['', Validators.required],
      NroDeAsistentes: ['', Validators.required],
      FechaInicial: ['', Validators.required],
      FechaFinal: ['', Validators.required],
      Presupuesto: ['', Validators.required],
    })
  }
  protected readonly title = signal('test');
  protected readonly activeImage = signal(0);
  protected readonly images = [
    { src: '/assets/imagenlanding1.png', width: 599, height: 399, class: 'imagen-landing-1' },
    { src: '/assets/imagenlanding2.png', width: 597, height: 398, class: 'imagen-landing-2' },
    { src: '/assets/imagenlanding3.png', width: 619, height: 400, class: 'imagen-landing-3' }
  ];
  private map: L.Map | undefined;
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeMap();
    }, 100);
    setTimeout(() => {
      this.initializeMap();
      this.initializeSectionAnimations();
    }, 100);
  }
  private initializeSectionAnimations(): void {
    const sections = document.querySelectorAll<HTMLElement>('section.section-fade');
    const primera = document.querySelector<HTMLElement>('section.cuerpo-1');
    const segunda = document.querySelector<HTMLElement>('section.cuerpo-2');
    if (primera) primera.classList.add('visible');
    if (segunda) segunda.classList.add('visible');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const section = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            section.classList.remove('visible');
            void section.offsetWidth; // fuerza reflow
            section.classList.add('visible');
          } else {
            section.classList.remove('visible');
          }
        });
      },
      { threshold: 0.3 }
    );
    sections.forEach((section) => observer.observe(section));
  }
  private initializeMap(): void {
    try {
      const mapElement = document.getElementById('map');
      if (!mapElement) {
        console.error('Elemento #map no encontrado');
        return;
      }
      this.map = L.map('map').setView([-12.0464, -77.0428], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(this.map);
      const markers = [
        { lat: -12.0464, lng: -77.0428, popup: 'Centro de Lima' },
        { lat: -12.1000, lng: -77.0300, popup: 'Miraflores' },
        { lat: -12.0833, lng: -77.0167, popup: 'San Isidro' },
        { lat: -12.0560, lng: -77.0850, popup: 'Callao' }
      ];
      markers.forEach(marker => {
        L.marker([marker.lat, marker.lng])
          .addTo(this.map!)
          .bindPopup(marker.popup);
      });
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 200);
    } catch (error) {
      console.error('Error inicializando el mapa:', error);
    }
  }
  @HostListener('window:resize')
  onResize() {
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 100);
  }
  nextImage(): void {
    const current = this.activeImage();
    const next = (current + 1) % this.images.length;
    this.activeImage.set(next);
  }
  prevImage(): void {
    const current = this.activeImage();
    const prev = (current - 1 + this.images.length) % this.images.length;
    this.activeImage.set(prev);
  }
  getImageClass(index: number): string {
    const activeIndex = this.activeImage();
    const totalImages = this.images.length;
    if (index === activeIndex) {
      return 'imagen-landing-3';
    } else if (index === (activeIndex + 1) % totalImages) {
      return 'imagen-landing-2';
    } else if (index === (activeIndex - 1 + totalImages) % totalImages) {
      return 'imagen-landing-1';
    } else {
      return 'imagen-landing-hidden';
    }
  }
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const fondo2 = document.querySelector('.cuerpo-fondo-2') as HTMLElement;
    const footer = document.querySelector('.footer') as HTMLElement;
    if (!fondo2 || !footer) return;
    const footerTop = footer.getBoundingClientRect().top;
    const windowHeight = window.innerHeight;
    if (footerTop < windowHeight + 100) {
      const fondoRect = fondo2.getBoundingClientRect();
      const scrollY = window.scrollY;
      const absoluteTop = fondoRect.top + scrollY;
      fondo2.style.position = 'absolute';
      fondo2.style.top = `${absoluteTop}px`;
      fondo2.style.bottom = 'auto';
    } else {
      fondo2.style.position = 'fixed';
      fondo2.style.bottom = '-175px';
      fondo2.style.top = 'auto';
    }
  }
}
