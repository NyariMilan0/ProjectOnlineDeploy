/* Importok és komponens definíció */
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormsModule } from '@angular/forms';
import { AdminPanelComponent } from '../admin-panel/admin-panel.component';
import { ProfileComponent } from '../profile/profile.component';

/* Interfész definíció (Interface Definition) */
export interface Item {
  id: number;
  sku: string;
  material: string;
  name: string;
  quantity: number;
  price: number;
  weight: number;
  dimensions: number;
  description: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-item-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, NavbarComponent, ProfileComponent, FormsModule, AdminPanelComponent],
  templateUrl: './item-list.component.html',
  styleUrls: ['./item-list.component.css']
})

/* Osztály és változók */
export class ItemListComponent implements OnInit {
  originalItems: Item[] = [];
  items: Item[] = [];
  selectedItem: Item | null = null;
  selectedCategories: string[] = [];
  isWeightAscending: boolean = true;
  isNameAscending: boolean = true;
  searchTerm: string = '';

  @ViewChild('itemModal', { static: false }) modalElement!: ElementRef;

  /* Konstruktor */
  constructor(private http: HttpClient) {}

  /* Inicializálás (ngOnInit) */
  ngOnInit(): void {
    this.http.get<{ items: any[] }>('http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/items/getItemList')
      .subscribe({
        next: (response) => {
          this.originalItems = response.items.map(item => ({
            id: item.id,
            sku: item.sku,
            material: item.type,
            name: item.name,
            quantity: item.amount,
            price: item.price,
            weight: item.weight,
            dimensions: item.size,
            description: item.description,
          }));
          this.items = [...this.originalItems];
        },
        error: (err) => {
          console.error('Error fetching items:', err);
          this.originalItems = [];
          this.items = [];
        }
      });
  }

  /* Modál kezelés (Modal Handling) */
  openModal(item: Item): void {
    this.selectedItem = item;
    if (this.modalElement) {
      const bootstrapModal = new (window as any).bootstrap.Modal(this.modalElement.nativeElement);
      bootstrapModal.show();
    } else {
      console.error('Modal element not found');
    }
  }

  /* Szűrő és rendezési függvények (Filter and Sort Functions) */
  toggleCategory(category: string): void {
    const index = this.selectedCategories.indexOf(category);
    if (index === -1) {
      this.selectedCategories.push(category);
    } else {
      this.selectedCategories.splice(index, 1);
    }
    this.filterItems();
  }

  filterItems(): void {
    let filteredItems = [...this.originalItems];

    if (this.selectedCategories.length > 0) {
      filteredItems = filteredItems.filter(item => 
        this.selectedCategories.some(category => item.material === category)
      );
    }

    if (this.searchTerm.trim()) {
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(this.searchTerm.trim().toLowerCase())
      );
    }

    this.items = filteredItems;
  }

  searchItems(): void {
    this.filterItems();
  }

  sortByWeight(): void {
    this.items.sort((a, b) => {
      return this.isWeightAscending ? a.weight - b.weight : b.weight - a.weight;
    });
    this.isWeightAscending = !this.isWeightAscending;
  }

  sortByName(): void {
    this.items.sort((a, b) => {
      return this.isNameAscending ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
    this.isNameAscending = !this.isNameAscending;
  }
}