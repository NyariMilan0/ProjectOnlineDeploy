import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { NavbarComponent } from '../navbar/navbar.component';
import { AdminPanelComponent } from '../admin-panel/admin-panel.component';
import { ProfileComponent } from '../profile/profile.component';
import { PalletsService, PalletWithShelf } from '../../_services/pallets.service';
import { ApiResponse } from '../../_services/admin-panel.service'; // Import ApiResponse from admin-panel.service
import { Subscription } from 'rxjs';

interface TransferItem {
  id: number;
  pallet: string;
  location: string;
  targetLocation: string;
  actionType: string;
  timeLimit: string;
  status: string;
}

@Component({
  selector: 'app-transfer-requests',
  standalone: true,
  imports: [CommonModule, HttpClientModule, NavbarComponent, AdminPanelComponent, ProfileComponent],
  templateUrl: './transfer-requests.component.html',
  styleUrls: ['./transfer-requests.component.css']
})
export class TransferRequestsComponent implements OnInit, OnDestroy {
  sortDirection: string = 'newest';
  sortDirectionLabel: string = 'Newest';
  transferData: TransferItem[] = [];
  filteredData: TransferItem[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  private subscription: Subscription = new Subscription();
  private intervalId: any;

  constructor(private http: HttpClient, private palletsService: PalletsService) {}

  ngOnInit() {
    this.fetchTransferRequests();
    this.intervalId = setInterval(() => this.updateExpiredStatuses(), 60000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.subscription.unsubscribe();
  }

  fetchTransferRequests() {
    this.isLoading = true;
    this.errorMessage = '';
    this.subscription.add(
      this.http
        .get<{ MovementRequests: any[]; statusCode: number }>(
          'http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/movementrequests/getMovementRequests'
        )
        .subscribe({
          next: (response) => {
            console.log('Raw response:', response);
            if (response && Array.isArray(response.MovementRequests)) {
              // Fetch pallet and shelf data
              this.palletsService.getPalletsWithShelfs().subscribe({
                next: (palletResponse: ApiResponse) => {
                  if (palletResponse.success && Array.isArray(palletResponse.data)) {
                    const pallets: PalletWithShelf[] = palletResponse.data;
                    this.transferData = response.MovementRequests.map(item => {
                      const pallet = pallets.find(p => p.palletId === item.pallet_id);
                      const status = item.status.charAt(0).toUpperCase() + item.status.slice(1).toLowerCase();
                      return {
                        id: item.id || 0,
                        pallet: pallet ? pallet.palletName : `Pallet ${item.pallet_id}`,
                        location: item.actionType.toLowerCase() === 'add' ? 'N/A' : pallet ? pallet.shelfName : 'Unknown',
                        targetLocation: pallet ? pallet.shelfName : `Shelf ${item.toShelfId}`,
                        actionType: item.actionType.charAt(0).toUpperCase() + item.actionType.slice(1).toLowerCase(),
                        timeLimit: item.timeLimit || new Date().toISOString(),
                        status: status
                      };
                    });
                    console.log('Mapped transferData:', this.transferData);
                    this.filteredData = [...this.transferData];
                    this.updateExpiredStatuses();
                    this.isLoading = false;
                  } else {
                    this.errorMessage = 'Failed to load pallet details.';
                    this.transferData = [];
                    this.filteredData = [];
                    this.isLoading = false;
                  }
                },
                error: (error: HttpErrorResponse) => {
                  console.error('Error fetching pallet details:', error);
                  this.errorMessage = 'Failed to load pallet details.';
                  this.transferData = [];
                  this.filteredData = [];
                  this.isLoading = false;
                }
              });
            } else {
              console.error('Unexpected response format:', response);
              this.errorMessage = 'Invalid data format received from server.';
              this.transferData = [];
              this.filteredData = [];
              this.isLoading = false;
            }
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error fetching movement requests:', error);
            this.errorMessage = 'Failed to load transfer requests. Please try again.';
            this.transferData = [];
            this.filteredData = [];
            this.isLoading = false;
          }
        })
    );
  }

  updateExpiredStatuses() {
    if (!Array.isArray(this.transferData)) {
      console.error('transferData is not an array:', this.transferData);
      this.transferData = [];
      this.filteredData = [];
      return;
    }

    const now = new Date();
    this.transferData = this.transferData.map(item => {
      if (item.status === 'Pending') {
        const timeLimit = new Date(item.timeLimit);
        if (now > timeLimit) {
          return { ...item, status: 'Failed' };
        }
      }
      return item;
    });
    this.filteredData = [...this.transferData];
  }

  confirmComplete(item: TransferItem) {
    const confirmed = confirm(`Are you sure you want to mark "${item.pallet}" as Completed?`);
    if (confirmed) {
      this.completeTransfer(item);
    }
  }

  completeTransfer(item: TransferItem) {
    const payload = {
      movementRequestId: item.id,
      userId: Number(localStorage.getItem('id')) || 42
    };
    this.subscription.add(
      this.http
        .post('http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources/movementrequests/completeMovementRequest', payload)
        .subscribe({
          next: () => {
            const index = this.transferData.findIndex(t => t.id === item.id);
            if (index !== -1) {
              this.transferData[index].status = 'Completed';
              this.filteredData = [...this.transferData];
            }
          },
          error: (error: HttpErrorResponse) => {
            console.error('Error completing movement request:', error);
            this.errorMessage = 'Failed to complete the transfer request. Please try again.';
          }
        })
    );
  }

  sortTable() {
    this.sortDirection = this.sortDirection === 'newest' ? 'oldest' : 'newest';
    this.sortDirectionLabel = this.sortDirection.charAt(0).toUpperCase() + this.sortDirection.slice(1);
    this.filteredData = [...this.filteredData].sort((a, b) => {
      const timeA = new Date(a.timeLimit);
      const timeB = new Date(b.timeLimit);
      return this.sortDirection === 'newest' ? timeB.getTime() - timeA.getTime() : timeA.getTime() - timeB.getTime();
    });
  }

  search(event: Event) {
    const query = (event.target as HTMLInputElement).value.trim().toLowerCase();
    if (!query) {
      this.filteredData = [...this.transferData];
      return;
    }
    if (!Array.isArray(this.transferData)) {
      console.error('transferData is not an array during search:', this.transferData);
      this.filteredData = [];
      return;
    }
    this.filteredData = this.transferData.filter(item =>
      (item.pallet || '').toLowerCase().includes(query) ||
      (item.location || '').toLowerCase().includes(query) ||
      (item.targetLocation || '').toLowerCase().includes(query) ||
      (item.actionType || '').toLowerCase().includes(query) ||
      (item.status || '').toLowerCase().includes(query)
    );
  }
}