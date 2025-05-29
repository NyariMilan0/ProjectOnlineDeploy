package com.helixlab.raktarproject.service;

import com.helixlab.raktarproject.model.MovementRequests;
import com.helixlab.raktarproject.model.Pallets;
import com.helixlab.raktarproject.model.Shelfs;
import com.helixlab.raktarproject.model.Users;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Persistence;
import java.util.ArrayList;
import java.util.Date;

/**
 * Service class for handling movement request operations with validation.
 */
public class MovementRequestService {

    private MovementRequests layer = new MovementRequests();
    private static final EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.helixLab_raktarproject_war_1.0-SNAPSHOTPU");

    public ArrayList<MovementRequests> getMovementRequests() {
        ArrayList<MovementRequests> movementList = new ArrayList<>();
        try {
            movementList = layer.getMovementRequests();
        } catch (Exception e) {
            System.err.println("Error fetching MovementRequests: " + e.getMessage());
        }
        return movementList;
    }

    // Segédmetódusok az azonosítók validálására
    private void validateAdminId(int adminId) throws IllegalArgumentException {
        EntityManager em = emf.createEntityManager();
        try {
            Users user = em.find(Users.class, adminId);
            if (user == null) {
                throw new IllegalArgumentException("Invalid adminId: User does not exist");
            }
            if (!user.getIsAdmin()) {
                throw new IllegalArgumentException("Invalid adminId: User is not an admin");
            }
            if (user.getIsDeleted() != null && user.getIsDeleted()) {
                throw new IllegalArgumentException("Invalid adminId: User is deleted");
            }
        } finally {
            em.close();
        }
    }

    private void validateUserId(int userId) throws IllegalArgumentException {
        EntityManager em = emf.createEntityManager();
        try {
            Users user = em.find(Users.class, userId);
            if (user == null) {
                throw new IllegalArgumentException("Invalid userId: User does not exist");
            }
            if (user.getIsDeleted() != null && user.getIsDeleted()) {
                throw new IllegalArgumentException("Invalid userId: User is deleted");
            }
        } finally {
            em.close();
        }
    }

    private void validatePalletId(int palletId) throws IllegalArgumentException {
        EntityManager em = emf.createEntityManager();
        try {
            Pallets pallet = em.find(Pallets.class, palletId);
            if (pallet == null) {
                throw new IllegalArgumentException("Invalid palletId: Pallet does not exist");
            }
        } finally {
            em.close();
        }
    }

    private void validateShelfId(int shelfId, String fieldName) throws IllegalArgumentException {
        EntityManager em = emf.createEntityManager();
        try {
            Shelfs shelf = em.find(Shelfs.class, shelfId);
            if (shelf == null) {
                throw new IllegalArgumentException("Invalid " + fieldName + ": Shelf does not exist");
            }
        } finally {
            em.close();
        }
    }

    private void validateMovementRequestId(int movementRequestId) throws IllegalArgumentException {
        EntityManager em = emf.createEntityManager();
        try {
            MovementRequests request = em.find(MovementRequests.class, movementRequestId);
            if (request == null) {
                throw new IllegalArgumentException("Invalid movementRequestId: Movement request does not exist");
            }
        } finally {
            em.close();
        }
    }

    public void createAddMovementRequest(int adminId, int palletId, int toShelfId, Date timeLimit) {
        try {
            // Validációk
            validateAdminId(adminId);
            validatePalletId(palletId);
            validateShelfId(toShelfId, "toShelfId");
            if (timeLimit == null) {
                throw new IllegalArgumentException("Invalid timeLimit: Must not be null");
            }

            // Tárolt eljárás meghívása
            MovementRequests.createAddMovementRequest(adminId, palletId, toShelfId, timeLimit);
        } catch (IllegalArgumentException e) {
            System.err.println("Validation error in createAddMovementRequest: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("Error in createAddMovementRequest: " + e.getMessage());
            throw new RuntimeException("Failed to create add movement request", e);
        }
    }

    public void createMoveMovementRequest(int adminId, int palletId, int fromShelfId, int toShelfId, Date timeLimit) {
        try {
            // Validációk
            validateAdminId(adminId);
            validatePalletId(palletId);
            validateShelfId(fromShelfId, "fromShelfId");
            validateShelfId(toShelfId, "toShelfId");
            if (timeLimit == null) {
                throw new IllegalArgumentException("Invalid timeLimit: Must not be null");
            }

            // Tárolt eljárás meghívása
            MovementRequests.createMoveMovementRequest(adminId, palletId, fromShelfId, toShelfId, timeLimit);
        } catch (IllegalArgumentException e) {
            System.err.println("Validation error in createMoveMovementRequest: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("Error in createMoveMovementRequest: " + e.getMessage());
            throw new RuntimeException("Failed to create move movement request", e);
        }
    }

    public void createRemoveMovementRequest(int adminId, int palletId, int fromShelfId, Date timeLimit) {
        try {
            // Validációk
            validateAdminId(adminId);
            validatePalletId(palletId);
            validateShelfId(fromShelfId, "fromShelfId");
            if (timeLimit == null) {
                throw new IllegalArgumentException("Invalid timeLimit: Must not be null");
            }

            // Tárolt eljárás meghívása
            MovementRequests.createRemoveMovementRequest(adminId, palletId, fromShelfId, timeLimit);
        } catch (IllegalArgumentException e) {
            System.err.println("Validation error in createRemoveMovementRequest: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("Error in createRemoveMovementRequest: " + e.getMessage());
            throw new RuntimeException("Failed to create remove movement request", e);
        }
    }

    public boolean completeMovementRequest(Integer movementRequestId, Integer userId) {
        try {
            // Validációk
            if (movementRequestId == null || movementRequestId <= 0) {
                throw new IllegalArgumentException("Invalid movementRequestId: Must be a positive integer");
            }
            if (userId == null || userId <= 0) {
                throw new IllegalArgumentException("Invalid userId: Must be a positive integer");
            }
            validateMovementRequestId(movementRequestId);
            validateUserId(userId);

            // Tárolt eljárás meghívása
            return layer.completeMovementRequest(movementRequestId, userId);
        } catch (IllegalArgumentException e) {
            System.err.println("Validation error in completeMovementRequest: " + e.getMessage());
            throw e;
        } catch (Exception e) {
            System.err.println("Error in service layer completing movement request with ID " + movementRequestId + ": " + e.getMessage());
            throw new RuntimeException("Failed to complete movement request", e);
        }
    }
}
