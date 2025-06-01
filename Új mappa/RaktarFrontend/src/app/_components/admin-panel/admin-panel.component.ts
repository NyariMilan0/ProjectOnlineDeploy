import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ModalService } from '../../_services/modal.service';
import { AdminPanelService, Storage, Shelf, Item, ApiResponse, User } from '../../_services/admin-panel.service';
import { PalletsService, PalletWithShelf } from '../../_services/pallets.service';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})
export class AdminPanelComponent implements OnInit, OnDestroy {
  userForm: FormGroup;
  adminForm: FormGroup;
  itemForm: FormGroup;
  storageForm: FormGroup;
  shelfForm: FormGroup;
  deleteShelfForm: FormGroup;
  deleteStorageForm: FormGroup;
  movementRequestForm: FormGroup;

  showModal: boolean = false;
  activeTab: string = 'registerUser';
  private subscription: Subscription = new Subscription();
  isAscending: boolean = true;

  userMessage: string = '';
  userMessageClass: string = '';
  adminMessage: string = '';
  adminMessageClass: string = '';
  itemMessage: string = '';
  itemMessageClass: string = '';
  storageMessage: string = '';
  storageMessageClass: string = '';
  shelfMessage: string = '';
  shelfMessageClass: string = '';
  deleteShelfMessage: string = '';
  deleteShelfMessageClass: string = '';
  deleteStorageMessage: string = '';
  deleteStorageMessageClass: string = '';
  deleteUserMessage: string = '';
  deleteUserMessageClass: string = '';
  movementRequestMessage: string = '';
  movementRequestMessageClass: string = '';
  isMovementRequestLoading: boolean = false;

  storages: Storage[] = [];
  shelves: Shelf[] = [];
  users: User[] = [];
  filteredUsers: User[] = [];
  pallets: PalletWithShelf[] = [];
  filteredPallets: PalletWithShelf[] = [];
  filteredShelvesForFrom: Shelf[] = [];
  filteredShelvesForTo: Shelf[] = [];
  palletsOnShelf: PalletWithShelf[] = [];
  searchTerm: string = '';
  palletSearchTerm: string = '';

  minDateTime: string;
  selectedPallet: PalletWithShelf | null = null;

  constructor(
    private fb: FormBuilder,
    private modalService: ModalService,
    private adminPanelService: AdminPanelService,
    private palletsService: PalletsService,
    private router: Router,
    private http: HttpClient
  ) {
    const now = new Date();
    this.minDateTime = now.toISOString().slice(0, 16);

    const adminId = Number(localStorage.getItem('id')) || 0;

    this.userForm = this.fb.group({
      userName: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), this.passwordComplexityValidator()]],
      picture: ['https://www.w3schools.com/howto/img_avatar.png']
    });

    this.adminForm = this.fb.group({
      userName: ['', Validators.required],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), this.passwordComplexityValidator()]],
      picture: ['https://www.w3schools.com/howto/img_avatar.png']
    });

    this.itemForm = this.fb.group({
      sku: ['', Validators.required],
      type: ['', Validators.required],
      name: ['', Validators.required],
      amount: ['', [Validators.required, Validators.min(1)]],
      price: ['', [Validators.required, Validators.min(1)]],
      weight: ['', [Validators.required, Validators.min(0.1)]],
      size: ['', [Validators.required, Validators.min(0.1)]],
      description: ['']
    });

    this.storageForm = this.fb.group({
      storageName: ['', Validators.required],
      location: ['', Validators.required]
    });

    this.shelfForm = this.fb.group({
      storageId: ['', Validators.required],
      shelfName: ['', Validators.required],
      locationIn: ['', Validators.required]
    });

    this.deleteShelfForm = this.fb.group({
      storageId: ['', Validators.required],
      shelfId: ['', Validators.required]
    });

    this.deleteStorageForm = this.fb.group({
      storageId: ['', Validators.required]
    });

    this.movementRequestForm = this.fb.group({
      requestType: ['add', Validators.required],
      adminId: [adminId >= 0 ? adminId : '', Validators.required],
      palletId: ['', Validators.required],
      fromStorageId: [''],
      fromShelfId: [''],
      toStorageId: [''],
      toShelfId: [''],
      timeLimit: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.subscription.add(
      this.modalService.showAdminModal$.subscribe(show => {
        this.showModal = show;
        if (show) {
          this.openModal();
          this.loadTabData();
        }
      })
    );

    this.subscription.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationEnd && this.showModal) {
          this.modalService.closeAdminModal();
        }
      })
    );

    this.subscription.add(
      this.movementRequestForm.get('requestType')?.valueChanges.subscribe(() => {
        this.setMovementRequestFormValidators();
        this.filteredPallets = [...this.pallets];
        this.selectedPallet = null;
        this.palletSearchTerm = '';
        this.filteredShelvesForFrom = [];
        this.filteredShelvesForTo = [];
        this.palletsOnShelf = [];
        this.movementRequestForm.patchValue({
          palletId: '',
          fromStorageId: '',
          fromShelfId: '',
          toStorageId: '',
          toShelfId: ''
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.modalService.closeAdminModal();
    this.subscription.unsubscribe();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    if (this.showModal) {
      this.loadTabData();
    }
  }

  openModal(): void {
    const modalElement = document.getElementById('adminPanelModal');
    if (modalElement) {
      const bootstrap = (window as any).bootstrap;
      if (bootstrap && bootstrap.Modal) {
        const modalInstance = new bootstrap.Modal(modalElement, {
          backdrop: 'static',
          keyboard: true
        });
        modalInstance.show();
      }
    }
  }

  closeModal(): void {
    const modalElement = document.getElementById('adminPanelModal');
    if (modalElement) {
      const bootstrap = (window as any).bootstrap;
      if (bootstrap && bootstrap.Modal) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        if (modalInstance) {
          modalInstance.hide();
          modalElement.classList.remove('show');
          modalElement.style.display = 'none';
          document.body.classList.remove('modal-open');
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) {
            backdrop.remove();
          }
        }
      }
    }
    this.modalService.closeAdminModal();
  }

  passwordComplexityValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value || '';
      if (value.length < 6) return { minlength: true };
      const hasUppercase = /[A-Z]/.test(value);
      const hasLowercase = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      return (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) ? { complexity: true } : null;
    };
  }

  getErrorMessage(control: AbstractControl | null, fieldName: string): string {
    if (!control || !control.errors || !control.touched) return '';
    const errors = control.errors;
    if (errors['required']) return `${fieldName} is required.`;
    if (errors['email']) return `${fieldName} must be a valid email address.`;
    if (errors['minlength']) return `${fieldName} must be at least 6 characters long.`;
    if (errors['min']) return `${fieldName} must be at least ${errors['min'].min}.`;
    if (errors['complexity']) return `${fieldName} must include at least one uppercase letter, one lowercase letter, one number, and one special character.`;
    return `Invalid ${fieldName.toLowerCase()}. Please check and try again!`;
  }

  fetchStorages(): void {
    this.adminPanelService.getAllStorages().subscribe({
      next: (response) => this.handleFetchResponse(response, 'storages'),
      error: (err) => console.error('Error fetching storages:', err)
    });
  }

  fetchShelvesByStorage(storageId: number): void {
    this.adminPanelService.getShelvesByStorage(storageId).subscribe({
      next: (response) => this.handleFetchResponse(response, 'shelves'),
      error: (err) => {
        this.shelves = [];
        this.deleteShelfMessage = err.status === 404 ? 'No shelves found for this storage.' : 'Error fetching shelves.';
        this.deleteShelfMessageClass = err.status === 404 ? 'alert-info' : 'alert-danger';
      }
    });
  }

  fetchUsers(): void {
    this.adminPanelService.getUsers().subscribe({
      next: (response) => this.handleFetchResponse(response, 'users'),
      error: (err) => {
        this.users = [];
        this.deleteUserMessage = err.status === 404 ? 'No users found.' : 'Error fetching users.';
        this.deleteUserMessageClass = err.status === 404 ? 'alert-info' : 'alert-danger';
      }
    });
  }

  fetchPallets(): void {
    this.palletsService.getPalletsWithShelfs().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.pallets = response.data;
          this.filteredPallets = [...this.pallets];
          this.movementRequestMessage = '';
          this.movementRequestMessageClass = '';
        } else {
          this.pallets = [];
          this.filteredPallets = [];
          this.movementRequestMessage = 'No pallets found.';
          this.movementRequestMessageClass = 'alert-info';
        }
      },
      error: (err) => {
        this.pallets = [];
        this.filteredPallets = [];
        this.movementRequestMessage = 'Error fetching pallets: ' + (err.message || 'Unknown error');
        this.movementRequestMessageClass = 'alert-danger';
        console.error('Error fetching pallets:', err);
      }
    });
  }

  fetchPalletsByShelf(shelfId: number): void {
    this.http.get<any>(`http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/shelfs/getPalletsWithShelfs`).subscribe({
      next: (response) => {
        console.log('API response for pallets:', response);
        if (response && response.palletsAndShelfs && Array.isArray(response.palletsAndShelfs)) {
          this.palletsOnShelf = response.palletsAndShelfs
            .filter((item: any) => item.shelfId === shelfId)
            .map((item: any) => ({
              palletId: item.palletId,
              palletName: item.palletName,
              shelfId: item.shelfId,
              shelfName: item.shelfName,
              shelfLocation: item.shelfLocation
            })) as PalletWithShelf[];
          this.filteredPallets = [...this.palletsOnShelf];
          this.movementRequestMessage = this.palletsOnShelf.length > 0 ? '' : 'No pallets found on this shelf.';
          this.movementRequestMessageClass = this.palletsOnShelf.length > 0 ? '' : 'alert-info';
          console.log('Pallets loaded:', this.palletsOnShelf);
        } else {
          this.palletsOnShelf = [];
          this.filteredPallets = [];
          this.movementRequestMessage = 'No pallets found on this shelf.';
          this.movementRequestMessageClass = 'alert-info';
          console.warn('No pallets or invalid response:', response);
        }
      },
      error: (err) => {
        this.palletsOnShelf = [];
        this.filteredPallets = [];
        this.movementRequestMessage = 'Error fetching pallets: ' + (err.message || 'Unknown error');
        this.movementRequestMessageClass = 'alert-danger';
        console.error('Error fetching pallets:', err);
      }
    });
  }

  filterPallets(): void {
  const requestType = this.movementRequestForm.get('requestType')?.value;
  const sourcePallets = requestType === 'add' ? this.pallets : this.palletsOnShelf;
  if (!this.palletSearchTerm.trim()) {
    this.filteredPallets = [...sourcePallets];
    return;
  }
  const term = this.palletSearchTerm.toLowerCase().trim();
  this.filteredPallets = sourcePallets.filter(pallet =>
    pallet.palletName?.toLowerCase().includes(term) || false
  );
}

  selectPallet(pallet: PalletWithShelf): void {
    this.selectedPallet = pallet;
    this.movementRequestForm.get('palletId')?.setValue(pallet.palletId);
    this.palletSearchTerm = '';
    this.filteredPallets = [...(this.movementRequestForm.get('requestType')?.value === 'add' ? this.pallets : this.palletsOnShelf)];
  }

  setMovementRequestFormValidators(): void {
    const requestType = this.movementRequestForm.get('requestType')?.value;
    const fromStorageId = this.movementRequestForm.get('fromStorageId');
    const fromShelfId = this.movementRequestForm.get('fromShelfId');
    const toStorageId = this.movementRequestForm.get('toStorageId');
    const toShelfId = this.movementRequestForm.get('toShelfId');

    if (requestType === 'add') {
      fromStorageId?.clearValidators();
      fromShelfId?.clearValidators();
      toStorageId?.setValidators([Validators.required]);
      toShelfId?.setValidators([Validators.required]);
    } else if (requestType === 'remove') {
      fromStorageId?.setValidators([Validators.required]);
      fromShelfId?.setValidators([Validators.required]);
      toStorageId?.clearValidators();
      toShelfId?.clearValidators();
    } else if (requestType === 'move') {
      fromStorageId?.setValidators([Validators.required]);
      fromShelfId?.setValidators([Validators.required]);
      toStorageId?.setValidators([Validators.required]);
      toShelfId?.setValidators([Validators.required]);
    }

    fromStorageId?.updateValueAndValidity();
    fromShelfId?.updateValueAndValidity();
    toStorageId?.updateValueAndValidity();
    toShelfId?.updateValueAndValidity();
  }

  onFromStorageChange(event: Event): void {
    const storageId = Number((event.target as HTMLSelectElement).value);
    if (storageId) {
      this.palletsService.getShelfsByStorageId(storageId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Remove shelfIsFull filter to include all shelves with pallets
            this.filteredShelvesForFrom = response.data;
            this.movementRequestForm.get('fromShelfId')?.setValue('');
            this.palletsOnShelf = [];
            this.filteredPallets = [];
            this.selectedPallet = null;
            this.movementRequestForm.get('palletId')?.setValue('');
            this.movementRequestMessage = '';
            this.movementRequestMessageClass = '';
          } else {
            this.filteredShelvesForFrom = [];
            this.movementRequestMessage = 'No shelves found for this storage.';
            this.movementRequestMessageClass = 'alert-info';
          }
        },
        error: (err) => {
          this.filteredShelvesForFrom = [];
          this.movementRequestMessage = 'Error fetching shelves: ' + (err.message || 'Unknown error');
          this.movementRequestMessageClass = 'alert-danger';
          console.error('Error fetching shelves:', err);
        }
      });
    } else {
      this.filteredShelvesForFrom = [];
      this.movementRequestForm.get('fromShelfId')?.setValue('');
      this.palletsOnShelf = [];
      this.filteredPallets = [];
      this.selectedPallet = null;
      this.movementRequestForm.get('palletId')?.setValue('');
      this.movementRequestMessage = '';
      this.movementRequestMessageClass = '';
    }
  }
  
  onToStorageChange(event: Event): void {
    const storageId = Number((event.target as HTMLSelectElement).value);
    if (storageId) {
      this.palletsService.getShelfsByStorageId(storageId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.filteredShelvesForTo = response.data.filter((shelf: Shelf) => !shelf.shelfIsFull);
            this.movementRequestForm.get('toShelfId')?.setValue('');
            this.movementRequestMessage = '';
            this.movementRequestMessageClass = '';
          } else {
            this.filteredShelvesForTo = [];
            this.movementRequestMessage = 'No available shelves found for this storage.';
            this.movementRequestMessageClass = 'alert-info';
          }
        },
        error: (err) => {
          this.filteredShelvesForTo = [];
          this.movementRequestMessage = 'Error fetching shelves: ' + (err.message || 'Unknown error');
          this.movementRequestMessageClass = 'alert-danger';
          console.error('Error fetching shelves:', err);
        }
      });
    } else {
      this.filteredShelvesForTo = [];
      this.movementRequestForm.get('toShelfId')?.setValue('');
      this.movementRequestMessage = '';
      this.movementRequestMessageClass = '';
    }
  }

  onFromShelfChange(event: Event): void {
    const shelfId = Number((event.target as HTMLSelectElement).value);
    const requestType = this.movementRequestForm.get('requestType')?.value;
    console.log(`onFromShelfChange called with shelfId: ${shelfId}, requestType: ${requestType}`);
    if (shelfId && (requestType === 'remove' || requestType === 'move')) {
      this.fetchPalletsByShelf(shelfId);
      this.movementRequestForm.get('palletId')?.setValue(''); // Reset pallet selection
      this.selectedPallet = null;
      this.palletSearchTerm = '';
    } else {
      this.palletsOnShelf = [];
      this.filteredPallets = [];
      this.selectedPallet = null;
      this.movementRequestForm.get('palletId')?.setValue('');
      if (requestType === 'add') {
        this.filteredPallets = [...this.pallets];
      }
      console.log('Reset pallets due to invalid shelfId or requestType:', { shelfId, requestType });
    }
  }

  onMovementRequestSubmit(): void {
    if (this.movementRequestForm.invalid) {
      this.movementRequestForm.markAllAsTouched();
      return;
    }
    this.movementRequestMessage = '';
    this.movementRequestMessageClass = '';
    this.isMovementRequestLoading = true;

    const formValue = this.movementRequestForm.value;
    const requestType = formValue.requestType;
    const adminId = Number(formValue.adminId);
    const palletId = Number(formValue.palletId);
    let timeLimit = formValue.timeLimit;

    try {
      const date = new Date(timeLimit);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      timeLimit = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:00`;
    } catch (e) {
      this.movementRequestMessage = 'Invalid time limit format. Please select a valid date and time.';
      this.movementRequestMessageClass = 'alert-danger';
      this.isMovementRequestLoading = false;
      return;
    }

    let endpoint = '';
    let payload: any = { adminId, palletId, timeLimit };

    if (requestType === 'add') {
      endpoint = 'http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/movementrequests/createAddMovementRequest';
      payload.toShelfId = Number(formValue.toShelfId);
    } else if (requestType === 'remove') {
      endpoint = 'http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/movementrequests/createRemoveMovementRequest';
      payload.fromShelfId = Number(formValue.fromShelfId);
    } else if (requestType === 'move') {
      endpoint = 'http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/movementrequests/createMoveMovementRequest';
      payload.fromShelfId = Number(formValue.fromShelfId);
      payload.toShelfId = Number(formValue.toShelfId);
    }

    this.http.post<any>(endpoint, payload).subscribe({
      next: (response) => {
        let isSuccess = false;
        let message = 'Movement request created successfully';

        // Handle different response formats
        if (typeof response === 'string') {
          isSuccess = response.toLowerCase().includes('successfully');
          message = response;
        } else if (response && response.success !== undefined) {
          isSuccess = response.success;
          message = response.message || message;
        } else {
          isSuccess = true; // Assume success if response is not an error
        }

        this.movementRequestMessage = message;
        this.movementRequestMessageClass = isSuccess ? 'alert-success' : 'alert-danger';

        if (isSuccess) {
          this.movementRequestForm.reset({ requestType: 'add', adminId });
          this.filteredPallets = [];
          this.filteredShelvesForFrom = [];
          this.filteredShelvesForTo = [];
          this.palletsOnShelf = [];
          this.selectedPallet = null;
        }
        this.isMovementRequestLoading = false;
      },
      error: (err) => {
        this.movementRequestMessage = err.error?.message || 'Failed to create movement request.';
        this.movementRequestMessageClass = 'alert-danger';
        this.isMovementRequestLoading = false;
      }
    });
  }

  onStorageChange(event: Event): void {
    const storageId = Number((event.target as HTMLSelectElement).value);
    if (storageId) {
      this.fetchShelvesByStorage(storageId);
    } else {
      this.shelves = [];
      this.deleteShelfMessage = '';
      this.deleteShelfMessageClass = '';
    }
  }

  onUserSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    this.userMessage = '';
    this.userMessageClass = '';
    this.adminPanelService.registerUser(this.userForm.value).subscribe({
      next: (response) => this.handleResponse(response, 'user'),
      error: (err) => {
        this.userMessage = 'Failed to register user.';
        this.userMessageClass = 'alert-danger';
        console.error('Error registering user:', err);
      }
    });
  }

  onAdminSubmit(): void {
    if (this.adminForm.invalid) {
      this.adminForm.markAllAsTouched();
      return;
    }
    this.adminMessage = '';
    this.adminMessageClass = '';
    this.adminPanelService.registerAdmin(this.adminForm.value).subscribe({
      next: (response) => this.handleResponse(response, 'admin'),
      error: (err) => {
        this.adminMessage = 'Failed to register admin.';
        this.adminMessageClass = 'alert-danger';
        console.error('Error registering admin:', err);
      }
    });
  }

  onItemSubmit(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }
    this.itemMessage = '';
    this.itemMessageClass = '';
    this.adminPanelService.addItem(this.itemForm.value).subscribe({
      next: (response) => this.handleResponse(response, 'item'),
      error: (err) => {
        this.itemMessage = 'Failed to add item.';
        this.itemMessageClass = 'alert-danger';
        console.error('Error adding item:', err);
      }
    });
  }

  onStorageSubmit(): void {
    if (this.storageForm.invalid) {
      this.storageForm.markAllAsTouched();
      return;
    }
    this.storageMessage = '';
    this.storageMessageClass = '';
    this.adminPanelService.addStorage(this.storageForm.value).subscribe({
      next: (response) => {
        this.handleResponse(response, 'storage');
        if (response.success) this.fetchStorages();
      },
      error: (err) => {
        this.storageMessage = 'Failed to add storage.';
        this.storageMessageClass = 'alert-danger';
        console.error('Error adding storage:', err);
      }
    });
  }

  onShelfSubmit(): void {
    if (this.shelfForm.invalid) {
      this.shelfForm.markAllAsTouched();
      return;
    }
    this.shelfMessage = '';
    this.shelfMessageClass = '';
    const shelfData = {
      storageId: Number(this.shelfForm.get('storageId')?.value),
      shelfName: this.shelfForm.get('shelfName')?.value,
      locationIn: this.shelfForm.get('locationIn')?.value
    };
    this.adminPanelService.addShelf(shelfData).subscribe({
      next: (response) => {
        this.handleResponse(response, 'shelf');
        if (response.success) {
          this.shelfForm.reset();
          this.fetchStorages();
        }
      },
      error: (err) => {
        this.shelfMessage = 'Failed to add shelf.';
        this.shelfMessageClass = 'alert-danger';
        console.error('Error adding shelf:', err);
      }
    });
  }

  onDeleteShelfSubmit(): void {
    if (this.deleteShelfForm.invalid) {
      this.deleteShelfForm.markAllAsTouched();
      return;
    }
    this.deleteShelfMessage = '';
    this.deleteShelfMessageClass = '';
    const shelfId = Number(this.deleteShelfForm.get('shelfId')?.value);
    this.adminPanelService.deleteShelf(shelfId).subscribe({
      next: (response) => {
        this.handleResponse(response, 'deleteShelf');
        if (response.success) {
          const storageId = Number(this.deleteShelfForm.get('storageId')?.value);
          this.fetchShelvesByStorage(storageId);
          this.fetchStorages();
        }
      },
      error: (err) => {
        this.deleteShelfMessage = 'Failed to delete shelf.';
        this.deleteShelfMessageClass = 'alert-danger';
        console.error('Error deleting shelf:', err);
      }
    });
  }

  onDeleteStorageSubmit(): void {
    if (this.deleteStorageForm.invalid) {
      this.deleteStorageForm.markAllAsTouched();
      return;
    }
    this.deleteStorageMessage = '';
    this.deleteStorageMessageClass = '';
    const storageId = Number(this.deleteStorageForm.get('storageId')?.value);
    this.adminPanelService.deleteStorage(storageId).subscribe({
      next: (response) => {
        this.handleResponse(response, 'deleteStorage');
        if (response.success) this.fetchStorages();
      },
      error: (err) => {
        this.deleteStorageMessage = 'Failed to delete storage.';
        this.deleteStorageMessageClass = 'alert-danger';
        console.error('Error deleting storage:', err);
      }
    });
  }

  onDeleteUserSubmit(userId: number): void {
    this.deleteUserMessage = '';
    this.deleteUserMessageClass = '';
    this.adminPanelService.deleteUser(userId).subscribe({
      next: (response) => {
        this.handleResponse(response, 'deleteUser');
        if (response.success) {
          this.fetchUsers();
        }
      },
      error: (err) => {
        this.deleteUserMessage = 'Failed to delete user.';
        this.deleteUserMessageClass = 'alert-danger';
        console.error('Error deleting user:', err);
      }
    });
  }

  filterUsers(): void {
    if (!this.searchTerm) {
      this.filteredUsers = this.users;
    } else {
      const term = this.searchTerm.toLowerCase();
      this.filteredUsers = this.users.filter(user =>
        user.userName.toLowerCase().includes(term) ||
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
      );
    }
  }

  sortUsers(): void {
    this.isAscending = !this.isAscending;
    this.filteredUsers = [...this.filteredUsers].sort((a, b) => {
      const comparison = a.userName.localeCompare(b.userName);
      return this.isAscending ? comparison : -comparison;
    });
  }

  confirmDelete(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.onDeleteUserSubmit(userId);
    }
  }

  private handleResponse(response: ApiResponse, type: string): void {
    switch (type) {
      case 'user':
        this.userMessage = response.message;
        this.userMessageClass = response.success ? 'alert-success' : 'alert-danger';
        if (response.success) this.userForm.reset();
        break;
      case 'admin':
        this.adminMessage = response.message;
        this.adminMessageClass = response.success ? 'alert-success' : 'alert-danger';
        if (response.success) this.adminForm.reset();
        break;
      case 'item':
        this.itemMessage = response.message;
        this.itemMessageClass = response.success ? 'alert-success' : 'alert-danger';
        if (response.success) this.itemForm.reset();
        break;
      case 'storage':
        this.storageMessage = response.message;
        this.storageMessageClass = response.success ? 'alert-success' : 'alert-danger';
        if (response.success) this.storageForm.reset();
        break;
      case 'shelf':
        this.shelfMessage = response.message;
        this.shelfMessageClass = response.success ? 'alert-success' : 'alert-danger';
        if (response.success) this.shelfForm.reset();
        break;
      case 'deleteShelf':
        this.deleteShelfMessage = response.message;
        this.deleteShelfMessageClass = response.success ? 'alert-success' : 'alert-danger';
        if (response.success) this.deleteShelfForm.reset();
        break;
      case 'deleteStorage':
        this.deleteStorageMessage = response.message;
        this.deleteStorageMessageClass = response.success ? 'alert-success' : 'alert-danger';
        if (response.success) this.deleteStorageForm.reset();
        break;
      case 'deleteUser':
        this.deleteUserMessage = response.message;
        this.deleteUserMessageClass = response.success ? 'alert-success' : 'alert-danger';
        break;
    }
  }

  private handleFetchResponse(response: ApiResponse, type: string): void {
    switch (type) {
      case 'storages':
        this.storages = response.data || [];
        this.shelfMessage = response.success ? '' : response.message;
        this.shelfMessageClass = response.success ? '' : 'alert-danger';
        this.deleteShelfMessage = response.success ? '' : response.message;
        this.deleteShelfMessageClass = response.success ? '' : 'alert-danger';
        this.deleteStorageMessage = response.success ? '' : response.message;
        this.deleteStorageMessageClass = response.success ? '' : 'alert-danger';
        if (response.success) {
          this.storages.forEach(storage => {
            this.adminPanelService.getShelvesByStorage(storage.id).subscribe({
              next: (shelfResponse) => {
                storage.hasShelves = shelfResponse.success && shelfResponse.data.length > 0;
              },
              error: (err) => {
                storage.hasShelves = false;
                console.error(`Error fetching shelves for storage ${storage.id}:`, err);
              }
            });
          });
        }
        break;
      case 'shelves':
        this.shelves = response.data || [];
        this.deleteShelfMessage = response.success && this.shelves.length === 0 ? 'No shelves found for this storage.' : '';
        this.deleteShelfMessageClass = response.success && this.shelves.length === 0 ? 'alert-info' : '';
        break;
      case 'users':
        this.users = response.data || [];
        this.filteredUsers = this.users;
        this.deleteUserMessage = response.success && this.users.length === 0 ? 'No users found.' : '';
        this.deleteUserMessageClass = response.success && this.users.length === 0 ? 'alert-info' : '';
        break;
    }
  }

  private loadTabData(): void {
    if (this.activeTab === 'addShelf' || this.activeTab === 'deleteShelf' || this.activeTab === 'deleteStorage' || this.activeTab === 'movementRequests') {
      this.fetchStorages();
    }
    if (this.activeTab === 'deleteUser') {
      this.fetchUsers();
    }
    if (this.activeTab === 'movementRequests') {
      this.fetchPallets();
    }
  }
}