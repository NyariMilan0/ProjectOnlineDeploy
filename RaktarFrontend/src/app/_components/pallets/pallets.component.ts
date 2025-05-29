import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { PalletsService, PalletWithShelf } from '../../_services/pallets.service';
import { Storage, Shelf, Item, ApiResponse } from '../../_services/admin-panel.service';
import { NavbarComponent } from '../navbar/navbar.component';
import { AdminPanelComponent } from '../admin-panel/admin-panel.component';
import { ProfileComponent } from '../profile/profile.component';

@Component({
  selector: 'app-pallets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent, AdminPanelComponent, ProfileComponent],
  templateUrl: './pallets.component.html',
  styleUrls: ['./pallets.component.css']
})
export class PalletsComponent implements OnInit {
  activeTab: string = 'addRemove';
  addPalletForm: FormGroup;
  removePalletForm: FormGroup;
  movePalletForm: FormGroup;
  addPalletMessage: string = '';
  removePalletMessage: string = '';
  movePalletMessage: string = '';
  addPalletMessageClass: string = '';
  removePalletMessageClass: string = '';
  movePalletMessageClass: string = '';
  isAddLoading = false;
  isRemoveLoading = false;
  isMoveLoading = false;
  filteredItems: Item[] = [];
  filteredShelves: Shelf[] = [];
  filteredAvailableShelves: Shelf[] = [];
  filteredShelvesWithPallets: Shelf[] = [];
  filteredPalletsForRemoval: PalletWithShelf[] = [];
  filteredPalletsForMove: PalletWithShelf[] = [];
  items: Item[] = [];
  allShelves: Shelf[] = [];
  pallets: PalletWithShelf[] = [];
  storages: Storage[] = [];

  constructor(private fb: FormBuilder, private palletsService: PalletsService) {
    const userId = Number(localStorage.getItem('id')) || 0;

    this.addPalletForm = this.fb.group({
      skuCode: ['', Validators.required],
      shelfId: ['', Validators.required],
      height: ['', [Validators.required, Validators.min(1)]]
    });

    this.removePalletForm = this.fb.group({
      shelfId: ['', Validators.required],
      palletId: ['', Validators.required]
    });

    this.movePalletForm = this.fb.group({
      sourceShelfId: ['', Validators.required],
      palletId: ['', Validators.required],
      targetStorageId: ['', Validators.required], // Added back
      targetShelfId: ['', Validators.required],
      userId: [userId >= 0 ? userId : '', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.palletsService.getAllItems().subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.items = response.data;
          this.filteredItems = this.items;
        } else {
          console.error('Failed to load items:', response.message, 'Response:', response);
          this.items = [];
          this.filteredItems = [];
        }
      },
      error: (err) => {
        console.error('Error fetching items:', err);
        this.items = [];
        this.filteredItems = [];
      }
    });

    this.palletsService.getAllShelfs().subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.allShelves = response.data;
          this.filteredShelves = this.allShelves;
          this.filteredAvailableShelves = this.allShelves.filter(shelf => !shelf.shelfIsFull);
          this.updateShelvesWithPallets();
        } else {
          console.error('Failed to load shelves:', response.message);
        }
      },
      error: (err) => console.error('Error fetching shelves:', err)
    });

    this.palletsService.getAllStorages().subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.storages = response.data;
        } else {
          console.error('Failed to load storages:', response.message);
        }
      },
      error: (err) => console.error('Error fetching storages:', err)
    });

    this.palletsService.getPalletsWithShelfs().subscribe({
      next: (response: ApiResponse) => {
        if (response.success) {
          this.pallets = response.data;
          this.updateShelvesWithPallets();
        } else {
          console.error('Failed to load pallets:', response.message);
        }
      },
      error: (err) => console.error('Error fetching pallets:', err)
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  filterItems(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredItems = this.items.filter(item =>
      item.sku.toLowerCase().includes(searchTerm) || item.name.toLowerCase().includes(searchTerm)
    );
  }

  filterShelves(event: Event): void {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.filteredShelves = this.allShelves.filter(shelf =>
      shelf.shelfName.toLowerCase().includes(searchTerm) || shelf.shelfLocation.toLowerCase().includes(searchTerm)
    );
    this.filteredAvailableShelves = this.filteredShelves.filter(shelf => !shelf.shelfIsFull);
    this.updateShelvesWithPallets();
  }

  updateShelvesWithPallets(): void {
    this.filteredShelvesWithPallets = this.filteredShelves.filter(shelf =>
      this.pallets.some(p => p.shelfId === shelf.id)
    );
    this.updateFilteredPalletsForRemoval();
  }

  updateFilteredPalletsForRemoval(): void {
    const shelfId = Number(this.removePalletForm.get('shelfId')?.value);
    this.filteredPalletsForRemoval = shelfId
      ? this.pallets.filter(p => p.shelfId === shelfId)
      : [];
  }

  onAddPalletSubmit(): void {
    if (this.addPalletForm.invalid) {
      this.addPalletForm.markAllAsTouched();
      return;
    }
    this.addPalletMessage = '';
    this.addPalletMessageClass = '';
    this.isAddLoading = true;
    this.palletsService.addPalletToShelf(this.addPalletForm.value).subscribe({
      next: (response: ApiResponse) => {
        this.addPalletMessage = response.message;
        this.addPalletMessageClass = response.success ? 'success-message' : 'error-message';
        if (response.success) {
          this.addPalletForm.reset();
          this.refreshShelvesAndPallets();
        }
        this.isAddLoading = false;
      },
      error: (err) => {
        this.addPalletMessage = err.error?.message || 'Failed to add pallet.';
        this.addPalletMessageClass = 'error-message';
        this.isAddLoading = false;
      }
    });
  }

  onRemovePalletSubmit(): void {
    if (this.removePalletForm.invalid) {
      this.removePalletForm.markAllAsTouched();
      return;
    }
    this.removePalletMessage = '';
    this.removePalletMessageClass = '';
    this.isRemoveLoading = true;
    const palletId = Number(this.removePalletForm.get('palletId')?.value);
    this.palletsService.deletePalletById(palletId).subscribe({
      next: (response: ApiResponse) => {
        this.removePalletMessage = response.message;
        this.removePalletMessageClass = response.success ? 'success-message' : 'error-message';
        if (response.success) {
          this.removePalletForm.reset();
          this.refreshShelvesAndPallets();
        }
        this.isRemoveLoading = false;
      },
      error: (err) => {
        this.removePalletMessage = err.error?.message || 'Failed to remove pallet.';
        this.removePalletMessageClass = 'error-message';
        this.isRemoveLoading = false;
      }
    });
  }

  onShelfChange(event: Event): void {
    const shelfId = Number((event.target as HTMLSelectElement).value);
    if (shelfId) {
      this.removePalletForm.get('palletId')?.setValue('');
      this.updateFilteredPalletsForRemoval();
    }
  }

  onSourceShelfChange(event: Event): void {
    const shelfId = Number((event.target as HTMLSelectElement).value);
    if (shelfId) {
      this.filteredPalletsForMove = this.pallets.filter(p => p.shelfId === shelfId);
      this.movePalletForm.get('palletId')?.setValue(''); // Reset pallet selection
    } else {
      this.filteredPalletsForMove = [];
    }
  }

  onTargetStorageChange(event: Event): void {
    const storageId = Number((event.target as HTMLSelectElement).value);
    if (storageId) {
      this.palletsService.getShelfsByStorageId(storageId).subscribe({
        next: (response: ApiResponse) => {
          if (response.success) {
            this.filteredAvailableShelves = response.data.filter((shelf: Shelf) => !shelf.shelfIsFull);
            this.movePalletForm.get('targetShelfId')?.setValue(''); // Reset target shelf selection
          } else {
            console.error('Failed to load target shelves:', response.message);
            this.filteredAvailableShelves = [];
          }
        },
        error: (err) => {
          console.error('Error fetching target shelves:', err);
          this.filteredAvailableShelves = [];
        }
      });
    } else {
      this.filteredAvailableShelves = [];
    }
  }

  onMovePalletSubmit(): void {
    if (this.movePalletForm.invalid) {
      this.movePalletForm.markAllAsTouched();
      return;
    }
    this.movePalletMessage = '';
    this.movePalletMessageClass = '';
    this.isMoveLoading = true;

    const palletId = Number(this.movePalletForm.get('palletId')?.value);
    const sourceShelfId = Number(this.movePalletForm.get('sourceShelfId')?.value);
    const targetShelfId = Number(this.movePalletForm.get('targetShelfId')?.value);
    const userId = Number(this.movePalletForm.get('userId')?.value);

    this.palletsService.movePallet(palletId, sourceShelfId, targetShelfId, userId).subscribe({
      next: (response: ApiResponse) => {
        this.movePalletMessage = response.message;
        this.movePalletMessageClass = response.success ? 'success-message' : 'error-message';
        if (response.success) {
          this.movePalletForm.reset({ userId });
          this.filteredPalletsForMove = [];
          this.filteredAvailableShelves = [];
          this.refreshShelvesAndPallets();
        }
        this.isMoveLoading = false;
      },
      error: (err) => {
        this.movePalletMessage = err.error?.message || 'Failed to move pallet.';
        this.movePalletMessageClass = 'error-message';
        this.isMoveLoading = false;
      }
    });
  }

  refreshShelvesAndPallets(): void {
    this.palletsService.getAllShelfs().subscribe({
      next: (res: ApiResponse) => {
        if (res.success) {
          this.allShelves = res.data;
          this.filteredShelves = this.allShelves;
          this.filteredAvailableShelves = this.allShelves.filter(shelf => !shelf.shelfIsFull);
          this.updateShelvesWithPallets();
        }
      },
      error: (err) => console.error('Error refreshing shelves:', err)
    });
    this.palletsService.getPalletsWithShelfs().subscribe({
      next: (res: ApiResponse) => {
        if (res.success) {
          this.pallets = res.data;
          this.updateShelvesWithPallets();
        }
      },
      error: (err) => console.error('Error refreshing pallets:', err)
    });
  }

  trackByItemId(index: number, item: Item): number {
    return item.id;
  }

  trackByShelfId(index: number, shelf: Shelf): number {
    return shelf.id;
  }

  trackByStorageId(index: number, storage: Storage): number {
    return storage.id;
  }

  trackByPalletId(index: number, pallet: PalletWithShelf): number {
    return pallet.palletId;
  }
}