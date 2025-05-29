import { Component, HostListener, ElementRef, ViewChild } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../_services/auth.service';
import { ModalService } from '../../_services/modal.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  isExpanded = false;
  isVisible = true;
  isMobile = window.innerWidth <= 768;

  /* Menü elemek */
  menuItems = [
    { path: '/storage', icon: 'DiagramIcon.svg', text: 'Storage' },
    { path: '/pallet-management', icon: 'PalletIcon.svg', text: 'Pallet Management' },
  ];

  @ViewChild('menuContainer') menuContainer!: ElementRef;

  constructor(
    private authService: AuthService,
    private router: Router,
    private modalService: ModalService,
    private elementRef: ElementRef
  ) {}

  /* Ablak méret figyelése */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.isExpanded = false;
    }
  }

  /* Hover események desktopra */
  @HostListener('mouseenter') onMouseEnter() {
    if (!this.isMobile) {
      this.isExpanded = true;
    }
  }

  @HostListener('mouseleave') onMouseLeave() {
    if (!this.isMobile) {
      this.isExpanded = false;
    }
  }

  /* Hamburger menü kapcsolása */
  toggleMenu() {
    if (this.isMobile) {
      this.isExpanded = !this.isExpanded;
    }
  }

  @ViewChild('hamburgerButton') hamburgerButton!: ElementRef;


  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (this.isMobile && this.isExpanded) {
      const clickedInside = this.menuContainer?.nativeElement.contains(event.target);
      const clickedHamburger = this.hamburgerButton?.nativeElement.contains(event.target);
  
      if (!clickedInside && !clickedHamburger) {
        this.isExpanded = false;
      }
    }
  }
  

  openProfileModal(): void {
    this.modalService.openProfileModal();
  }

  openAdminModal(): void {
    this.modalService.openAdminModal();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
