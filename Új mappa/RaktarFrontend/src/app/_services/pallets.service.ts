import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Storage, Shelf, Item, ApiResponse } from '../_services/admin-panel.service';

export interface PalletWithShelf {
  shelfId: number;
  shelfLocation: string;
  palletId: number;
  palletName: string;
  shelfName: string;
}

@Injectable({ providedIn: 'root' })
export class PalletsService {
  private baseUrl = 'http://127.0.0.1:8080/raktarproject-1.0-SNAPSHOT/webresources';

  constructor(private http: HttpClient) {}

  getAllItems(): Observable<ApiResponse> {
    return this.http.get<any>(`${this.baseUrl}/items/getItemList`).pipe(
      map(response => {
        let items: Item[] = [];

        if (Array.isArray(response)) {
          items = response;
        } else if (response && Array.isArray(response.items)) {
          items = response.items;
        } else {
          console.error('Unexpected response format:', response);
          return { success: false, message: 'Invalid items data format', data: [] };
        }

        return {
          success: true,
          message: items.length > 0 ? 'Items loaded successfully' : 'No items found',
          data: items
        };
      }),
      catchError(this.handleHttpError('fetching items', []))
    );
  }

  getAllShelfs(): Observable<ApiResponse> {
    return this.http.get<any>(`${this.baseUrl}/shelfs/getAllShelfs`).pipe(
      map(response => {
        if (response && Array.isArray(response.shelfs)) {
          const shelves: Shelf[] = response.shelfs.map((shelf: any) => ({
            id: shelf.id,
            shelfName: shelf.name,
            shelfLocation: shelf.locationInStorage,
            shelfIsFull: shelf.isFull,
            shelfMaxCapacity: shelf.maxCapacity,
            currentCapacity: shelf.currentCapacity,
            length: shelf.length,
            width: shelf.width,
            levels: shelf.levels,
            height: shelf.height
          }));
          return { success: true, message: 'Shelves loaded successfully', data: shelves };
        }
        return { success: false, message: 'Invalid shelves data', data: [] };
      }),
      catchError(this.handleHttpError('fetching all shelves', []))
    );
  }

  getAllStorages(): Observable<ApiResponse> {
    return this.http.get<{ Storages: any[] }>(`${this.baseUrl}/storage/getAllStorages`).pipe(
      map(response => {
        if (response && Array.isArray(response.Storages)) {
          const storages: Storage[] = response.Storages.map(storage => ({
            id: storage.id,
            storageName: storage.name,
            location: storage.location,
            currentCapacity: storage.currentCapacity,
            maxCapacity: storage.maxCapacity,
            isFull: storage.isFull,
            hasShelves: false
          }));
          return { success: true, message: 'Storages loaded successfully', data: storages };
        }
        return { success: false, message: 'Invalid storages data', data: [] };
      }),
      catchError(this.handleHttpError('fetching storages', []))
    );
  }

  addPalletToShelf(palletData: any): Observable<ApiResponse> {
    return this.http.post(`${this.baseUrl}/pallet/addPalletToShelf`, palletData).pipe(
      map(() => ({ success: true, message: 'Pallet added successfully!' })),
      catchError(this.handleHttpError('adding pallet to shelf'))
    );
  }

  getPalletsWithShelfs(): Observable<ApiResponse> {
    return this.http.get<any>(`${this.baseUrl}/shelfs/getPalletsWithShelfs`).pipe(
      map(response => {
        if (response && Array.isArray(response.palletsAndShelfs)) {
          const pallets: PalletWithShelf[] = response.palletsAndShelfs.map((pallet: any) => ({
            shelfId: pallet.shelfId,
            shelfLocation: pallet.shelfLocation,
            palletId: pallet.palletId,
            palletName: pallet.palletName,
            shelfName: pallet.shelfName
          }));
          return { success: true, message: 'Pallets with shelves loaded successfully', data: pallets };
        }
        return { success: false, message: 'Invalid pallets data', data: [] };
      }),
      catchError(this.handleHttpError('fetching pallets with shelves', []))
    );
  }

  deletePalletById(palletId: number): Observable<ApiResponse> {
    return this.http.delete(`${this.baseUrl}/pallet/deletePalletById?id=${palletId}`).pipe(
      map(() => ({ success: true, message: 'Pallet deleted successfully!' })),
      catchError(this.handleHttpError('deleting pallet'))
    );
  }

  getShelfsByStorageId(storageId: number): Observable<ApiResponse> {
    return this.http.get<any>(`${this.baseUrl}/shelfs/getShelfsByStorageId?storageId=${storageId}`).pipe(
      map(response => {
        if (response && Array.isArray(response.shelves)) {
          const shelves: Shelf[] = response.shelves.map((shelf: any) => ({
            id: shelf.shelfId,
            shelfName: shelf.shelfName,
            shelfLocation: shelf.shelfLocation,
            shelfIsFull: shelf.shelfIsFull,
            shelfMaxCapacity: shelf.shelfMaxCapacity
          }));
          return { success: true, message: 'Shelves loaded successfully', data: shelves };
        }
        return { success: false, message: 'No shelves found', data: [] };
      }),
      catchError(this.handleHttpError('fetching shelves by storage id', []))
    );
  }

  movePallet(palletId: number, fromShelfId: number, toShelfId: number, userId: number): Observable<ApiResponse> {
    const moveData = { palletId, fromShelfId, toShelfId, userId };
    return this.http.post<any>(`${this.baseUrl}/pallet/movePalletBetweenShelfs`, moveData).pipe(
      map(response => ({
        success: response.statusCode === 200,
        message: response.message || 'Pallet moved successfully!',
        data: null,
        statusCode: response.statusCode
      })),
      catchError(this.handleHttpError('moving pallet'))
    );
  }

  private handleHttpError(operation: string, defaultData: any = []): (error: HttpErrorResponse) => Observable<ApiResponse> {
    return (error: HttpErrorResponse) => {
      let message = `An error occurred while ${operation}.`;
      if (error.error && error.error.message) {
        message = error.error.message;
      } else {
        switch (error.status) {
          case 400:
            message = `Bad request while ${operation}. Please check your input.`;
            break;
          case 404:
            message = `Resource not found while ${operation}.`;
            break;
          case 500:
            message = `Server error while ${operation}. Please try again later.`;
            break;
          default:
            message = `Unexpected error while ${operation}. (${error.status})`;
        }
      }
      console.error(`Error ${operation}:`, error);
      return of({ success: false, message, data: defaultData });
    };
  }
}