/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.helixlab.raktarproject.model;

import java.io.Serializable;
import java.util.Collection;
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
import javax.persistence.OneToMany;
import javax.persistence.ParameterMode;
import javax.persistence.Persistence;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.Size;

/**
 *
 * @author nidid
 */
@Entity
@Table(name = "pallets")
@NamedQueries({
    @NamedQuery(name = "Pallets.findAll", query = "SELECT p FROM Pallets p"),
    @NamedQuery(name = "Pallets.findById", query = "SELECT p FROM Pallets p WHERE p.id = :id"),
    @NamedQuery(name = "Pallets.findByName", query = "SELECT p FROM Pallets p WHERE p.name = :name"),
    @NamedQuery(name = "Pallets.findByCreatedAt", query = "SELECT p FROM Pallets p WHERE p.createdAt = :createdAt"),
    @NamedQuery(name = "Pallets.findByHeight", query = "SELECT p FROM Pallets p WHERE p.height = :height"),
    @NamedQuery(name = "Pallets.findByLength", query = "SELECT p FROM Pallets p WHERE p.length = :length"),
    @NamedQuery(name = "Pallets.findByWidth", query = "SELECT p FROM Pallets p WHERE p.width = :width")})
public class Pallets implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Size(max = 50)
    @Column(name = "name")
    private String name;
    @Column(name = "created_at")
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdAt;
    @Column(name = "height")
    private Integer height;
    @Column(name = "length")
    private Integer length;
    @Column(name = "width")
    private Integer width;
    @OneToMany(mappedBy = "palletId")
    private Collection<PalletsXShelfs> palletsXShelfsCollection;
    @OneToMany(mappedBy = "palletId")
    private Collection<PalletsXItems> palletsXItemsCollection;

    static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.helixLab_raktarproject_war_1.0-SNAPSHOTPU");

    public Pallets() {
    }

    public Pallets(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            Pallets p = em.find(Pallets.class, id);

            this.id = p.getId();
            this.name = p.getName();
            this.createdAt = p.getCreatedAt();
            this.height = p.getHeight();
            this.length = p.getLength();
            this.width = p.getWidth();
        } catch (Exception ex) {
            System.err.println("Error: " + ex.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }
    }

    public Pallets(Integer id, String name, Date createdAt, Integer height, Integer lenght, Integer width) {
        this.id = id;
        this.name = name;
        this.createdAt = createdAt;
        this.height = height;
        this.length = lenght;
        this.width = width;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Integer getLength() {
        return length;
    }

    public void setLength(Integer length) {
        this.length = length;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Collection<PalletsXShelfs> getPalletsXShelfsCollection() {
        return palletsXShelfsCollection;
    }

    public void setPalletsXShelfsCollection(Collection<PalletsXShelfs> palletsXShelfsCollection) {
        this.palletsXShelfsCollection = palletsXShelfsCollection;
    }

    public Collection<PalletsXItems> getPalletsXItemsCollection() {
        return palletsXItemsCollection;
    }

    public void setPalletsXItemsCollection(Collection<PalletsXItems> palletsXItemsCollection) {
        this.palletsXItemsCollection = palletsXItemsCollection;
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
        if (!(object instanceof Pallets)) {
            return false;
        }
        Pallets other = (Pallets) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.helixlab.raktarproject.model.Pallets[ id=" + id + " ]";
    }

    public Pallets getPalletsById(Integer id) {
        try {
            return new Pallets(id);
        } catch (Exception e) {
            System.err.println("Error: " + e.getLocalizedMessage());
            return null;
        }
    }

    public Boolean deletePalletById(Integer id) {
        EntityManager em = emf.createEntityManager();
        Boolean toReturn = false;

        try {

            StoredProcedureQuery spq = em.createStoredProcedureQuery("deletePalletById");
            spq.registerStoredProcedureParameter("palletId", Integer.class, ParameterMode.IN);
            spq.setParameter("palletId", id);

            spq.execute();

            toReturn = true;

        } catch (Exception e) {
            System.err.println("Error: " + e.getLocalizedMessage());
            toReturn = false;
        } finally {
            em.clear();
            em.close();
            return toReturn;
        }

    }

    public static void addPalletToShelf(String skuCode, Integer shelfId, Integer height) {
        EntityManager em = emf.createEntityManager();

        try {
            em.getTransaction().begin();

            StoredProcedureQuery spq = em.createStoredProcedureQuery("addPalletToShelf");
            spq.registerStoredProcedureParameter("skuCodeIn", String.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("shelfId", Integer.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("heightIn", Integer.class, javax.persistence.ParameterMode.IN);

            spq.setParameter("skuCodeIn", skuCode);
            spq.setParameter("shelfId", shelfId);
            spq.setParameter("heightIn", height);

            spq.execute();

            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            System.err.println("Error adding pallet to shelf: " + e.getLocalizedMessage());
            throw new RuntimeException("Failed to add pallet to shelf", e);
        } finally {
            em.clear();
            em.close();
        }
    }

    public static void movePalletBetweenShelfs(Integer palletId, Integer fromShelfId, Integer toShelfId, Integer userId) {
        EntityManager em = emf.createEntityManager();

        try {
            em.getTransaction().begin();

            StoredProcedureQuery spq = em.createStoredProcedureQuery("movePalletBetweenShelfs");
            spq.registerStoredProcedureParameter("palletIdIn", Integer.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("fromShelfIdIn", Integer.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("toShelfIdIn", Integer.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("userIdIn", Integer.class, javax.persistence.ParameterMode.IN);

            spq.setParameter("palletIdIn", palletId);
            spq.setParameter("fromShelfIdIn", fromShelfId);
            spq.setParameter("toShelfIdIn", toShelfId);
            spq.setParameter("userIdIn", userId);

            spq.execute();

            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            System.err.println("Error moving pallet between shelfs: " + e.getLocalizedMessage());
            throw new RuntimeException("Failed to move pallet between shelfs", e);
        } finally {
            em.clear();
            em.close();
        }
    }

}
