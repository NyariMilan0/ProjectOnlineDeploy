import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ModalService {
  private showProfileModal = new BehaviorSubject<boolean>(false);
  private showAdminModal = new BehaviorSubject<boolean>(false);
  
  showProfileModal$ = this.showProfileModal.asObservable();
  showAdminModal$ = this.showAdminModal.asObservable();

  openProfileModal() {
    this.showProfileModal.next(true);
  }

  closeProfileModal() {
    this.showProfileModal.next(false);
  }

  openAdminModal() {
    this.showAdminModal.next(true);
  }

  closeAdminModal() {
    this.showAdminModal.next(false);
  }

  resetModals() {
    this.showProfileModal.next(false);
    this.showAdminModal.next(false);
  }
}