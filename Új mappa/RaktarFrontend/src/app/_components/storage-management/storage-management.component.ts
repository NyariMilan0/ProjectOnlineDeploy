import { Component, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';
import { ProfileComponent } from '../profile/profile.component';
import { AdminPanelComponent } from '../admin-panel/admin-panel.component';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-storage-management',
  standalone: true,
  imports: [CommonModule, HttpClientModule, NavbarComponent, ProfileComponent, AdminPanelComponent, ReactiveFormsModule],
  templateUrl: './storage-management.component.html',
  styleUrls: ['./storage-management.component.css']
})
export class StorageManagementComponent implements AfterViewInit, OnDestroy {
  storages: any[] = [];
  selectedStorage: any = null;
  shelves: any[] = [];
  selectedShelf: any = null;
  filteredShelves: any[] = [];
  pallets: any[] = [];
  items: any[] = [];
  lowStockItems: any[] = [];
  storageCapacity: number = 0;
  showPopup: boolean = false;
  sidebarOpen: boolean = false;

  @ViewChild('carouselItems') carouselItems!: ElementRef;
  @ViewChild('carouselContainer') carouselContainer!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;

  private isDragging = false;
  private startY = 0;
  private startTranslate = 0;
  private animationFrameId: number | null = null;
  private eventListeners: any = {};

  constructor(private http: HttpClient) {
    this.loadStorages();
    this.loadOverallCapacity();
    this.loadPallets();
    this.loadItems();
  }

  ngAfterViewInit() {
    this.setupDragging();
    this.duplicateItemsForInfiniteScroll();
    this.setupSearch();
  }

  ngOnDestroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.removeEventListeners();
  }

  // Sidebar állapot kezelése
  onSidebarToggle(state: boolean) {
    this.sidebarOpen = state;
  }

  loadStorages() {
    this.http.get('http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/storage/getAllStorages')
      .subscribe({
        next: (response: any) => {
          this.storages = response.Storages || [];
          this.selectedStorage = this.storages[0] || null;
          if (this.selectedStorage) {
            this.loadShelvesForStorage(this.selectedStorage.id);
          }
        },
        error: (error) => console.error('Error loading storages:', error)
      });
  }

  loadOverallCapacity() {
    this.http.get('http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/shelfs/getCapacityByShelfUsage')
      .subscribe({
        next: (response: any) => {
          const { currentFreeSpaces, maxCapacity } = response.shelfUsageSummary;
          this.storageCapacity = Math.round(((maxCapacity - currentFreeSpaces) / maxCapacity) * 100);
        },
        error: (error) => console.error('Error loading overall capacity:', error)
      });
  }

  loadPallets() {
    this.http.get('http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/shelfs/getPalletsWithShelfs')
      .subscribe({
        next: (response: any) => {
          this.pallets = response.palletsAndShelfs || [];
          this.updateShelvesWithPallets();
          this.updateLowStockItems();
        },
        error: (error) => console.error('Error loading pallets:', error)
      });
  }

  loadItems() {
    this.http.get('http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/items/getItemList')
      .subscribe({
        next: (response: any) => {
          this.items = response.items || [];
          this.updateLowStockItems();
        },
        error: (error) => console.error('Error loading items:', error)
      });
  }

  loadShelvesForStorage(storageId: number) {
    this.http.get(`http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/shelfs/getShelfsByStorageId?storageId=${storageId}`)
      .subscribe({
        next: (response: any) => {
          this.shelves = response.shelves.map((shelf: any) => ({
            id: shelf.shelfId,
            name: shelf.shelfName,
            free: shelf.shelfMaxCapacity,
            used: 0,
            usage: 0,
            critical: shelf.shelfIsFull,
            isFull: shelf.shelfIsFull,
            maxCapacity: shelf.shelfMaxCapacity
          }));
          this.updateShelvesWithPallets();
          this.filteredShelves = [...this.shelves];
          this.selectedShelf = this.shelves[0] || null;
        },
        error: (error) => console.error('Error loading shelves:', error)
      });
  }

  updateShelvesWithPallets() {
    if (this.shelves.length === 0 || this.pallets.length === 0) return;

    this.shelves.forEach(shelf => {
      const palletCount = this.pallets.filter(pallet => pallet.shelfId === shelf.id).length;
      shelf.used = palletCount;
      shelf.free = shelf.maxCapacity - palletCount;
      shelf.usage = Math.round((palletCount / shelf.maxCapacity) * 100);
      shelf.critical = shelf.free === 0;
      shelf.isFull = shelf.free === 0;
    });
  }

  updateLowStockItems() {
    if (this.items.length === 0 || this.pallets.length === 0) return;

    const palletCounts: { [key: string]: number } = {};
    this.pallets.forEach(pallet => {
      palletCounts[pallet.palletName] = (palletCounts[pallet.palletName] || 0) + 1;
    });

    this.lowStockItems = this.items
      .map(item => {
        const inStock = palletCounts[item.name] || 0;
        const totalAmount = item.amount;
        const stockPercentage = totalAmount > 0 ? Math.round((inStock / totalAmount) * 100) : 0;
        return {
          category: item.type,
          name: item.name,
          stock: stockPercentage
        };
      })
      .filter(item => item.stock < 10);
  }

  selectStorage(storage: any) {
    this.selectedStorage = storage;
    this.loadShelvesForStorage(storage.id);
    this.showPopup = false;
  }

  selectShelf(shelf: any) {
    this.selectedShelf = shelf;
    this.showPopup = false;
  }

  togglePopup() {
    this.showPopup = !this.showPopup;
  }

  getPalletsForSelectedShelf() {
    if (!this.selectedShelf) return [];
    return this.pallets.filter(pallet => pallet.shelfId === this.selectedShelf.id);
  }

  getSectionSpaces() {
    if (!this.selectedShelf) return [];
    
    const totalSpaces = 24;
    const gridSize = 12;
    const totalGridSquares = 24;
    const grids = [];
    
    const usedSpaces = this.selectedShelf.used;
    let remainingUsed = usedSpaces;
    let remainingFree = totalSpaces - usedSpaces;

    for (let i = 0; i < 2; i++) {
      const grid = [];
      const usedInThisGrid = Math.min(remainingUsed, gridSize);

      for (let j = 0; j < gridSize; j++) {
        if (j < usedInThisGrid) {
          grid.push({ used: true });
          remainingUsed--;
        } else {
          grid.push({ used: false });
          remainingFree--;
        }
      }
      grids.push(grid);
    }
    return grids;
  }

  private duplicateItemsForInfiniteScroll() {
    const items = this.carouselItems.nativeElement.children as HTMLCollectionOf<HTMLElement>;
    const clone = Array.from(items, (item: HTMLElement) => item.cloneNode(true) as HTMLElement);
    clone.forEach((clonedItem: HTMLElement) => this.carouselItems.nativeElement.appendChild(clonedItem));
  }

  private setupDragging() {
    const carousel = this.carouselItems.nativeElement as HTMLElement;
    const container = this.carouselContainer.nativeElement as HTMLElement;

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      this.isDragging = true;
      this.startY = e.pageY;
      this.startTranslate = this.getTranslateY();
      carousel.classList.add('dragging');
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!this.isDragging) return;
      const deltaY = e.pageY - this.startY;
      const newTranslate = this.startTranslate + deltaY;
      carousel.style.transform = `translateY(${newTranslate}px)`;
      this.checkBoundaries();
    };

    const onMouseUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        carousel.classList.remove('dragging');
        this.checkBoundaries();
        this.startAutoScroll();
      }
    };

    const onMouseLeave = () => {
      if (this.isDragging) {
        this.isDragging = false;
        carousel.classList.remove('dragging');
        this.checkBoundaries();
        this.startAutoScroll();
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseLeave);

    this.eventListeners = { onMouseDown, onMouseMove, onMouseUp, onMouseLeave };
    this.startAutoScroll();
  }

  private removeEventListeners() {
    const container = this.carouselContainer.nativeElement as HTMLElement;
    container.removeEventListener('mousedown', this.eventListeners.onMouseDown);
    document.removeEventListener('mousemove', this.eventListeners.onMouseMove);
    document.removeEventListener('mouseup', this.eventListeners.onMouseUp);
    container.removeEventListener('mouseleave', this.eventListeners.onMouseLeave);
  }

  private getTranslateY(): number {
    const style = window.getComputedStyle(this.carouselItems.nativeElement);
    const transform = style.transform || style.webkitTransform;
    if (transform === 'none') return 0;
    const matrix = transform.match(/matrix.*\((.+)\)/);
    return matrix ? parseFloat(matrix[1].split(', ')[5]) : 0;
  }

  private checkBoundaries() {
    const carousel = this.carouselItems.nativeElement as HTMLElement;
    const containerHeight = this.carouselContainer.nativeElement.offsetHeight;
    const contentHeight = carousel.offsetHeight / 2;
    let translateY = this.getTranslateY();

    if (translateY > 0) {
      translateY = -contentHeight;
    } else if (translateY < -contentHeight) {
      translateY = 0;
    }

    carousel.style.transform = `translateY(${translateY}px)`;
  }

  private startAutoScroll() {
    const carousel = this.carouselItems.nativeElement as HTMLElement;
    const containerHeight = this.carouselContainer.nativeElement.offsetHeight;
    const contentHeight = carousel.offsetHeight / 2;
    const speed = 0.2;

    const scroll = () => {
      if (this.isDragging) return;

      let translateY = this.getTranslateY();
      translateY -= speed;

      if (translateY < -contentHeight) {
        translateY = 0;
      }

      carousel.style.transform = `translateY(${translateY}px)`;
      this.animationFrameId = requestAnimationFrame(scroll);
    };

    this.animationFrameId = requestAnimationFrame(scroll);
  }

  private setupSearch() {
    const input = this.searchInput.nativeElement as HTMLInputElement;
    input.addEventListener('input', () => {
      const searchTerm = input.value.trim().toLowerCase();
      this.filteredShelves = this.shelves.filter(shelf =>
        shelf.name.toLowerCase().includes(searchTerm)
      );
      if (this.filteredShelves.length === 0 || !this.filteredShelves.includes(this.selectedShelf)) {
        this.selectedShelf = this.filteredShelves[0] || this.shelves[0];
      }
    });
  }
}