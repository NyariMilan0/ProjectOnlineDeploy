package com.helixlab.raktarproject.service;

import com.helixlab.raktarproject.model.Items;
import com.helixlab.raktarproject.model.Pallets;
import com.helixlab.raktarproject.model.Shelfs;
import com.helixlab.raktarproject.model.Users;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.NoResultException;
import javax.persistence.Persistence;
import javax.persistence.Query;

public class PalletService {

    private Pallets layer = new Pallets();

    public Pallets getPalletsById(Integer id) {
        return layer.getPalletsById(id);
    }

    public Boolean deletePalletById(Integer id) {
        // Ellenőrizzük, hogy az id létezik-e az adatbázisban
        EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.helixLab_raktarproject_war_1.0-SNAPSHOTPU");
        EntityManager em = emf.createEntityManager();
        try {
            Pallets pallet = em.createNamedQuery("Pallets.findById", Pallets.class)
                    .setParameter("id", id)
                    .getSingleResult();

            if (pallet != null) {
                // Ha az id létezik, töröljük a raklapot
                return layer.deletePalletById(id);
            } else {
                System.err.println("The Pallet with ID " + id + " doesn't exist in the database");
                return false;
            }
        } catch (NoResultException e) {
            System.err.println("The Pallet with ID " + id + " doesn't exist in the database");
            return false;
        } catch (Exception e) {
            System.err.println("Error checking pallet existence: " + e.getLocalizedMessage());
            return false;
        } finally {
            em.clear();
            em.close();
        }
    }

    public void addPalletToShelf(String skuCode, Integer shelfId, Integer height) {
        try {
            EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.helixLab_raktarproject_war_1.0-SNAPSHOTPU");
            EntityManager em = emf.createEntityManager();

            try {
                // Validáció: Ellenőrizzük, hogy a SKU létezik-e az items táblában
                Query query = em.createQuery("SELECT i FROM Items i WHERE i.sku = :skuCode");
                query.setParameter("skuCode", skuCode);
                Items item = (Items) query.getSingleResult();
                if (item == null) {
                    throw new IllegalArgumentException("SKU code '" + skuCode + "' does not exist in the items table");
                }

                // Validáció: Ellenőrizzük, hogy a shelfId létezik-e a shelfs táblában
                Query shelfQuery = em.createQuery("SELECT s FROM Shelfs s WHERE s.id = :shelfId");
                shelfQuery.setParameter("shelfId", shelfId);
                Shelfs shelf = (Shelfs) shelfQuery.getSingleResult();
                if (shelf == null) {
                    throw new IllegalArgumentException("Shelf with id " + shelfId + " does not exist");
                }
            } catch (javax.persistence.NoResultException e) {
                throw new IllegalArgumentException("Invalid input: " + e.getMessage());
            } finally {
                em.close();
            }

            // Ha a validáció sikeres, hívjuk meg a model metódust
            Pallets.addPalletToShelf(skuCode, shelfId, height);
        } catch (Exception e) {
            throw new RuntimeException("Service layer error: " + e.getMessage(), e);
        }
    }

    public void movePalletBetweenShelfs(Integer palletId, Integer fromShelfId, Integer toShelfId, Integer userId) {
        try {
            // Validáció: Ellenőrizzük, hogy a pallet létezik-e
            Pallets pallet = getPalletsById(palletId);
            if (pallet == null) {
                throw new IllegalArgumentException("Pallet with id " + palletId + " does not exist");
            }

            // Validáció: Ellenőrizzük, hogy a fromShelf és toShelf létezik-e
            EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.helixLab_raktarproject_war_1.0-SNAPSHOTPU");
            EntityManager em = emf.createEntityManager();

            try {
                Query fromQuery = em.createQuery("SELECT s FROM Shelfs s WHERE s.id = :shelfId");
                fromQuery.setParameter("shelfId", fromShelfId);
                Shelfs fromShelf = (Shelfs) fromQuery.getSingleResult();
                if (fromShelf == null) {
                    throw new IllegalArgumentException("From shelf with id " + fromShelfId + " does not exist");
                }

                Query toQuery = em.createQuery("SELECT s FROM Shelfs s WHERE s.id = :shelfId");
                toQuery.setParameter("shelfId", toShelfId);
                Shelfs toShelf = (Shelfs) toQuery.getSingleResult();
                if (toShelf == null) {
                    throw new IllegalArgumentException("To shelf with id " + toShelfId + " does not exist");
                }
            } catch (javax.persistence.NoResultException e) {
                throw new IllegalArgumentException("One of the shelves does not exist: " + e.getMessage());
            } finally {
                em.close();
            }

            // Validáció: Ellenőrizzük, hogy a user létezik-e
            try {
                Users user = new Users(userId); // Feltételezem, hogy van getShelfsById-szerű konstruktor a Users-ben
                if (user == null) {
                    throw new IllegalArgumentException("User with id " + userId + " does not exist");
                }
            } catch (Exception e) {
                throw new IllegalArgumentException("User with id " + userId + " does not exist: " + e.getMessage());
            }

            // Ha a validációk sikeresek, hívjuk meg a model metódust
            Pallets.movePalletBetweenShelfs(palletId, fromShelfId, toShelfId, userId);
        } catch (Exception e) {
            throw new RuntimeException("Service layer error: " + e.getMessage(), e);
        }
    }
}
