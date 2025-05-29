/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.helixlab.raktarproject.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Date;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.ParameterMode;
import javax.persistence.Persistence;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 *
 * @author nidid
 */
@Entity
@Table(name = "movement_requests")
@NamedQueries({
    @NamedQuery(name = "MovementRequests.findAll", query = "SELECT m FROM MovementRequests m"),
    @NamedQuery(name = "MovementRequests.findById", query = "SELECT m FROM MovementRequests m WHERE m.id = :id"),
    @NamedQuery(name = "MovementRequests.findByAdminId", query = "SELECT m FROM MovementRequests m WHERE m.adminId = :adminId"),
    @NamedQuery(name = "MovementRequests.findByPalletId", query = "SELECT m FROM MovementRequests m WHERE m.palletId = :palletId"),
    @NamedQuery(name = "MovementRequests.findByFromShelfId", query = "SELECT m FROM MovementRequests m WHERE m.fromShelfId = :fromShelfId"),
    @NamedQuery(name = "MovementRequests.findByToShelfId", query = "SELECT m FROM MovementRequests m WHERE m.toShelfId = :toShelfId"),
    @NamedQuery(name = "MovementRequests.findByActionType", query = "SELECT m FROM MovementRequests m WHERE m.actionType = :actionType"),
    @NamedQuery(name = "MovementRequests.findByStatus", query = "SELECT m FROM MovementRequests m WHERE m.status = :status"),
    @NamedQuery(name = "MovementRequests.findByTimeLimit", query = "SELECT m FROM MovementRequests m WHERE m.timeLimit = :timeLimit")})
public class MovementRequests implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Column(name = "adminId")
    private int adminId;
    @Basic(optional = false)
    @NotNull
    @Column(name = "pallet_id")
    private int palletId;
    @Column(name = "fromShelfId")
    private Integer fromShelfId;
    @Column(name = "toShelfId")
    private Integer toShelfId;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 100)
    @Column(name = "actionType")
    private String actionType;
    @Basic(optional = false)
    @NotNull
    @Size(min = 1, max = 11)
    @Column(name = "status")
    private String status;
    @Basic(optional = false)
    @NotNull
    @Column(name = "timeLimit")
    @Temporal(TemporalType.TIMESTAMP)
    private Date timeLimit;

    static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.helixLab_raktarproject_war_1.0-SNAPSHOTPU");

    public MovementRequests() {
    }

    public MovementRequests(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            MovementRequests mr = em.find(MovementRequests.class, id);

            this.id = mr.getId();
            this.adminId = mr.getAdminId();
            this.palletId = mr.getPalletId();
            this.fromShelfId = mr.getFromShelfId();
            this.toShelfId = mr.getToShelfId();
            this.actionType = mr.getActionType();
            this.status = mr.getStatus();
            this.timeLimit = mr.getTimeLimit();
        } catch (Exception ex) {
            System.err.println("Error: " + ex.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }
    }

    public MovementRequests(Integer id, int adminId, int palletId, int fromshelfId, int toShelfId, String actionType, String status, Date timeLimit) {
        this.id = id;
        this.adminId = adminId;
        this.palletId = palletId;
        this.fromShelfId = fromshelfId;
        this.toShelfId = toShelfId;
        this.actionType = actionType;
        this.status = status;
        this.timeLimit = timeLimit;
    }

    public MovementRequests(Integer id, int adminId, int palletId, String actionType, String status, Date timeLimit) {
        this.id = id;
        this.adminId = adminId;
        this.palletId = palletId;
        this.actionType = actionType;
        this.status = status;
        this.timeLimit = timeLimit;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public int getAdminId() {
        return adminId;
    }

    public void setAdminId(int adminId) {
        this.adminId = adminId;
    }

    public int getPalletId() {
        return palletId;
    }

    public void setPalletId(int palletId) {
        this.palletId = palletId;
    }

    public Integer getFromShelfId() {
        return fromShelfId;
    }

    public void setFromShelfId(Integer fromShelfId) {
        this.fromShelfId = fromShelfId;
    }

    public Integer getToShelfId() {
        return toShelfId;
    }

    public void setToShelfId(Integer toShelfId) {
        this.toShelfId = toShelfId;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getTimeLimit() {
        return timeLimit;
    }

    public void setTimeLimit(Date timeLimit) {
        this.timeLimit = timeLimit;
    }

    @Override
    public int hashCode() {
        int hash = 0;
        hash += (id != null ? id.hashCode() : 0);
        return hash;
    }

    @Override
    public boolean equals(Object object) {
        // TODO: Warning - this method won't work in the case the id fields are not set
        if (!(object instanceof MovementRequests)) {
            return false;
        }
        MovementRequests other = (MovementRequests) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.helixlab.raktarproject.model.MovementRequests[ id=" + id + " ]";
    }

    public static ArrayList<MovementRequests> getMovementRequests() {
        EntityManager em = emf.createEntityManager();
        ArrayList<MovementRequests> movementList = new ArrayList<>();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getMovementRequests", MovementRequests.class);
            spq.execute();
            movementList = new ArrayList<>(spq.getResultList());
        } catch (Exception e) {
            System.err.println("Error: " + e.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }

        return movementList;
    }

    public boolean completeMovementRequest(Integer movementRequestId, Integer userId) {
        EntityManager em = emf.createEntityManager();
        boolean success = false;
        try {
            em.getTransaction().begin();

            // Ellenőrizzük, hogy a kérelem létezik-e és pending státuszú-e
            MovementRequests request = em.find(MovementRequests.class, movementRequestId);
            if (request == null) {
                throw new IllegalArgumentException("Movement request with ID " + movementRequestId + " does not exist");
            }
            if (!"pending".equalsIgnoreCase(request.getStatus())) {
                throw new IllegalArgumentException("Movement request with ID " + movementRequestId + " is already completed or invalid");
            }

            StoredProcedureQuery spq = em.createStoredProcedureQuery("completeMovementRequest");
            spq.registerStoredProcedureParameter("movementRequestIdIn", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("userIdIn", Integer.class, ParameterMode.IN);
            spq.setParameter("movementRequestIdIn", movementRequestId);
            spq.setParameter("userIdIn", userId);
            spq.execute();

            // Ellenőrizzük, hogy a státusz megváltozott-e
            em.refresh(request); // Frissítjük az entitást az adatbázis aktuális állapotával
            if ("completed".equalsIgnoreCase(request.getStatus())) {
                success = true;
            }

            em.getTransaction().commit();
        } catch (IllegalArgumentException e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            throw e;
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            System.err.println("Error in completeMovementRequest: " + e.getMessage());
            throw new RuntimeException("Failed to complete movement request", e);
        } finally {
            em.close();
        }
        return success;
    }

    public static void createAddMovementRequest(int adminId, int palletId, int toShelfId, Date timeLimit) {
        EntityManager em = emf.createEntityManager();
        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("createAddMovementRequest");
            spq.registerStoredProcedureParameter("adminIdIn", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("palletIdIn", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("toShelfIdIn", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("timeLimitIn", Date.class, ParameterMode.IN);

            spq.setParameter("adminIdIn", adminId);
            spq.setParameter("palletIdIn", palletId);
            spq.setParameter("toShelfIdIn", toShelfId);
            spq.setParameter("timeLimitIn", timeLimit);

            spq.execute();
        } catch (Exception e) {
            System.err.println("Error executing createAddMovementRequest: " + e.getLocalizedMessage());
            throw e;
        } finally {
            em.clear();
            em.close();
        }
    }

    public static void createMoveMovementRequest(int adminId, int palletId, int fromShelfId, int toShelfId, Date timeLimit) {
        EntityManager em = emf.createEntityManager();
        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("createMoveMovementRequest");
            spq.registerStoredProcedureParameter("adminIdIn", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("palletIdIn", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("fromShelfIdIn", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("toShelfIdIn", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("timeLimitIn", Date.class, ParameterMode.IN);

            spq.setParameter("adminIdIn", adminId);
            spq.setParameter("palletIdIn", palletId);
            spq.setParameter("fromShelfIdIn", fromShelfId);
            spq.setParameter("toShelfIdIn", toShelfId);
            spq.setParameter("timeLimitIn", timeLimit);

            spq.execute();
        } catch (Exception e) {
            System.err.println("Error executing createMoveMovementRequest: " + e.getLocalizedMessage());
            throw e;
        } finally {
            em.clear();
            em.close();
        }
    }

    public static void createRemoveMovementRequest(int adminId, int palletId, int fromShelfId, Date timeLimit) {
        EntityManager em = emf.createEntityManager();
        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("createRemoveMovementRequest");
            spq.registerStoredProcedureParameter("adminIdIn", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("palletIdIn", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("fromShelfIdIn", Integer.class, ParameterMode.IN);
            spq.registerStoredProcedureParameter("timeLimitIn", Date.class, ParameterMode.IN);

            spq.setParameter("adminIdIn", adminId);
            spq.setParameter("palletIdIn", palletId);
            spq.setParameter("fromShelfIdIn", fromShelfId);
            spq.setParameter("timeLimitIn", timeLimit);

            spq.execute();
        } catch (Exception e) {
            System.err.println("Error executing createRemoveMovementRequest: " + e.getLocalizedMessage());
            throw e;
        } finally {
            em.clear();
            em.close();
        }
    }

}
