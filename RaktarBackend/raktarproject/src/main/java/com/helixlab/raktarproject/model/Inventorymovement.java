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
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Persistence;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author nidid
 */
@Entity
@Table(name = "inventorymovement")
@XmlRootElement
@NamedQueries({
    @NamedQuery(name = "Inventorymovement.findAll", query = "SELECT i FROM Inventorymovement i"),
    @NamedQuery(name = "Inventorymovement.findById", query = "SELECT i FROM Inventorymovement i WHERE i.id = :id"),
    @NamedQuery(name = "Inventorymovement.findByMovementDate", query = "SELECT i FROM Inventorymovement i WHERE i.movementDate = :movementDate"),
    @NamedQuery(name = "Inventorymovement.findByActionType", query = "SELECT i FROM Inventorymovement i WHERE i.actionType = :actionType"),
    @NamedQuery(name = "Inventorymovement.findByPalletSKU", query = "SELECT i FROM Inventorymovement i WHERE i.palletSKU = :palletSKU")})
public class Inventorymovement implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Column(name = "movementDate")
    @Temporal(TemporalType.TIMESTAMP)
    private Date movementDate;
    @Size(max = 11)
    @Column(name = "actionType")
    private String actionType;
    @Size(max = 50)
    @Column(name = "palletSKU")
    private String palletSKU;
    @JoinColumn(name = "storageFrom", referencedColumnName = "id")
    @ManyToOne
    private Storage storageFrom;
    @JoinColumn(name = "storageTo", referencedColumnName = "id")
    @ManyToOne
    private Storage storageTo;
    @JoinColumn(name = "fromShelf", referencedColumnName = "id")
    @ManyToOne
    private Shelfs fromShelf;
    @JoinColumn(name = "toShelf", referencedColumnName = "id")
    @ManyToOne
    private Shelfs toShelf;
    @JoinColumn(name = "byUser", referencedColumnName = "id")
    @ManyToOne
    private Users byUser;

    static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.helixLab_raktarproject_war_1.0-SNAPSHOTPU");

    public Inventorymovement() {
    }

    public Inventorymovement(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            Inventorymovement im = em.find(Inventorymovement.class, id);

            this.id = im.getId();
            this.movementDate = im.getMovementDate();
            this.actionType = im.getActionType();
            this.storageFrom = im.getStorageFrom();
            this.storageTo = im.getStorageTo();
            this.fromShelf = im.getFromShelf();
            this.toShelf = im.getToShelf();
            this.palletSKU = im.getPalletSKU();
            this.byUser = im.getByUser();

        } catch (Exception ex) {
            System.err.println("Error: " + ex.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }
    }

    public Inventorymovement(Integer id, Date movementDate, String actionType, Storage storageFrom, Storage storageTo, Shelfs fromShelf, Shelfs toShelf, String palletSKU, Users byUser) {
        this.id = id;
        this.movementDate = movementDate;
        this.actionType = actionType;
        this.storageFrom = storageFrom;
        this.storageTo = storageTo;
        this.fromShelf = fromShelf;
        this.toShelf = toShelf;
        this.palletSKU = palletSKU;
        this.byUser = byUser;

    }

    public Inventorymovement(Integer id, Date movementDate) {
        this.id = id;
        this.movementDate = movementDate;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Date getMovementDate() {
        return movementDate;
    }

    public void setMovementDate(Date movementDate) {
        this.movementDate = movementDate;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getPalletSKU() {
        return palletSKU;
    }

    public void setPalletSKU(String palletSKU) {
        this.palletSKU = palletSKU;
    }

    public Storage getStorageFrom() {
        return storageFrom;
    }

    public void setStorageFrom(Storage storageFrom) {
        this.storageFrom = storageFrom;
    }

    public Storage getStorageTo() {
        return storageTo;
    }

    public void setStorageTo(Storage storageTo) {
        this.storageTo = storageTo;
    }

    public Shelfs getFromShelf() {
        return fromShelf;
    }

    public void setFromShelf(Shelfs fromShelf) {
        this.fromShelf = fromShelf;
    }

    public Shelfs getToShelf() {
        return toShelf;
    }

    public void setToShelf(Shelfs toShelf) {
        this.toShelf = toShelf;
    }

    public Users getByUser() {
        return byUser;
    }

    public void setByUser(Users byUser) {
        this.byUser = byUser;
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
        if (!(object instanceof Inventorymovement)) {
            return false;
        }
        Inventorymovement other = (Inventorymovement) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.helixlab.raktarproject.model.Inventorymovement[ id=" + id + " ]";
    }
    
    public static ArrayList<Inventorymovement> getInventoryMovement() {
        EntityManager em = emf.createEntityManager();
        ArrayList<Inventorymovement> inventorymovementlist = new ArrayList<>();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getInventoryMovement", Inventorymovement.class);
            spq.execute();
            inventorymovementlist = new ArrayList<>(spq.getResultList());
        } catch (Exception e) {
            System.err.println("Error: " + e.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }
        
        return inventorymovementlist;
    }

}
