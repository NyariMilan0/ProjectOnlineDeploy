package com.helixlab.raktarproject.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.Id;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.OneToMany;
import javax.persistence.ParameterMode;
import javax.persistence.Persistence;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Entity
@Table(name = "shelfs")
@NamedQueries({
    @NamedQuery(name = "Shelfs.findAll", query = "SELECT s FROM Shelfs s"),
    @NamedQuery(name = "Shelfs.findById", query = "SELECT s FROM Shelfs s WHERE s.id = :id"),
    @NamedQuery(name = "Shelfs.findByName", query = "SELECT s FROM Shelfs s WHERE s.name = :name"),
    @NamedQuery(name = "Shelfs.findByLocationInStorage", query = "SELECT s FROM Shelfs s WHERE s.locationInStorage = :locationInStorage"),
    @NamedQuery(name = "Shelfs.findByIsFull", query = "SELECT s FROM Shelfs s WHERE s.isFull = :isFull")})
public class Shelfs implements Serializable {

    @Column(name = "max_capacity")
    private Integer maxCapacity;
    @Column(name = "current_capacity")
    private Integer currentCapacity;
    @Column(name = "height")
    private Integer height;
    @Column(name = "length")
    private Integer length;
    @Column(name = "width")
    private Integer width;
    @Column(name = "levels")
    private Integer levels;
    @OneToMany(mappedBy = "shelfId")
    private Collection<PalletsXShelfs> palletsXShelfsCollection;
    @OneToMany(mappedBy = "fromShelf")
    private Collection<Inventorymovement> inventorymovementCollection;
    @OneToMany(mappedBy = "toShelf")
    private Collection<Inventorymovement> inventorymovementCollection1;

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @NotNull
    @Column(name = "id")
    private Integer id;
    @Size(max = 255)
    @Column(name = "name")
    private String name;
    //erre hibát adott a wildfly
    //@Lob
    //@Size(max = 65535)
    //@Column(name = "capacity")
    //private String capacity;
    @Size(max = 255)
    @Column(name = "locationInStorage")
    private String locationInStorage;
    @Column(name = "isFull")
    private Boolean isFull;
    @OneToMany(mappedBy = "shelfId")
    private Collection<ShelfsXStorage> shelfsXStorageCollection;

    static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.helixLab_raktarproject_war_1.0-SNAPSHOTPU");

    public Shelfs() {
    }

    public Shelfs(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            Shelfs s = em.find(Shelfs.class, id);

            this.id = s.getId();
            this.name = s.getName();
            this.locationInStorage = s.getLocationInStorage();
            this.maxCapacity = s.getMaxCapacity();
            this.currentCapacity = s.getCurrentCapacity();
            this.height = s.getHeight();
            this.length = s.getLength();
            this.width = s.getWidth();
            this.levels = s.getLevels();
            this.isFull = s.getIsFull();

        } catch (Exception ex) {
            System.err.println("Hiba: " + ex.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }
    }

    public Shelfs(Integer id, String name, String locationInStorage, Integer maxCapacity, Integer currentCapacity, Integer height, Integer length, Integer width, Integer levels, boolean isFull) {
        this.id = id;
        this.name = name;
        this.locationInStorage = locationInStorage;
        this.maxCapacity = maxCapacity;
        this.currentCapacity = currentCapacity;
        this.height = height;
        this.length = length;
        this.width = width;
        this.levels = levels;
        this.isFull = isFull;
    }

    public Shelfs(Integer currentCapacity, Integer maxCapacity) {
        this.currentCapacity = currentCapacity;
        this.maxCapacity = maxCapacity;
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

    //public String getCapacity() {
    //    return capacity;
    //}
    //public void setCapacity(String capacity) {
    //    this.capacity = capacity;
    //}
    public String getLocationInStorage() {
        return locationInStorage;
    }

    public void setLocationInStorage(String locationInStorage) {
        this.locationInStorage = locationInStorage;
    }

    public Boolean getIsFull() {
        return isFull;
    }

    public void setIsFull(Boolean isFull) {
        this.isFull = isFull;
    }

    public Collection<ShelfsXStorage> getShelfsXStorageCollection() {
        return shelfsXStorageCollection;
    }

    public void setShelfsXStorageCollection(Collection<ShelfsXStorage> shelfsXStorageCollection) {
        this.shelfsXStorageCollection = shelfsXStorageCollection;
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
        if (!(object instanceof Shelfs)) {
            return false;
        }
        Shelfs other = (Shelfs) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.helixlab.raktarproject.model.Shelfs[ id=" + id + " ]";
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public Integer getCurrentCapacity() {
        return currentCapacity;
    }

    public void setCurrentCapacity(Integer currentCapacity) {
        this.currentCapacity = currentCapacity;
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

    public Integer getLevels() {
        return levels;
    }

    public void setLevels(Integer levels) {
        this.levels = levels;
    }

    public static ShelfCapacitySummaryDTO getCapacityByShelfUsage() {
        EntityManager em = emf.createEntityManager();
        ShelfCapacitySummaryDTO summary = null;

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getCapacityByShelfUsage");
            spq.execute();

            List<Object[]> results = spq.getResultList();
            if (!results.isEmpty()) {
                Object[] result = results.get(0);
                summary = new ShelfCapacitySummaryDTO(
                        result[0] != null ? ((Number) result[0]).intValue() : 0, // currentFreeSpaces
                        result[1] != null ? ((Number) result[1]).intValue() : 0 // maxCapacity
                );
            }
        } catch (Exception e) {
            System.err.println("Error: " + e.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }

        return summary;
    }

    public Shelfs getShelfsById(Integer id) {
        try {
            return new Shelfs(id);
        } catch (Exception e) {
            System.err.println("Error: " + e.getLocalizedMessage());
            return null;
        }
    }

    public Boolean deleteShelfFromStorage(Integer id) {
        EntityManager em = emf.createEntityManager();
        Boolean toReturn = false;

        try {
            Shelfs shelf = em.find(Shelfs.class, id);
            if (shelf == null) {
                System.err.println("Cannot delete: Shelf with ID " + id + " does not exist");
                return false;
            }

            StoredProcedureQuery spq = em.createStoredProcedureQuery("deleteShelfFromStorage");
            spq.registerStoredProcedureParameter("shelfIdIn", Integer.class, ParameterMode.IN);
            spq.setParameter("shelfIdIn", id);

            spq.execute();
            toReturn = true;

        } catch (Exception e) {
            System.err.println("Error deleting shelf with ID " + id + ": " + e.getLocalizedMessage());
            toReturn = false;
        } finally {
            em.clear();
            em.close();
        }

        return toReturn;
    }

    public static void addShelfToStorage(String shelfName, String locationIn, Integer storageId) {
        EntityManager em = emf.createEntityManager();

        try {
            em.getTransaction().begin();

            StoredProcedureQuery spq = em.createStoredProcedureQuery("addShelfToStorage");
            spq.registerStoredProcedureParameter("storageIdIn", Integer.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("shelfNameIn", String.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("locationIn", String.class, javax.persistence.ParameterMode.IN);

            spq.setParameter("storageIdIn", storageId);
            spq.setParameter("shelfNameIn", shelfName);
            spq.setParameter("locationIn", locationIn);

            spq.execute();

            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            System.err.println("Error adding shelf to storage: " + e.getLocalizedMessage());
            throw new RuntimeException("Failed to add shelf to storage", e);
        } finally {
            em.clear();
            em.close();
        }
    }

    public static List<PalletShelfDTO> getPalletsWithShelfs() {
        EntityManager em = emf.createEntityManager();
        List<PalletShelfDTO> resultList = new ArrayList<>();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getPalletsWithShelfs");
            spq.execute();

            List<Object[]> result = spq.getResultList();
            for (Object[] row : result) {
                Integer palletId = (Integer) row[0];
                String palletName = (String) row[1];
                Integer shelfId = (Integer) row[2];
                String shelfName = (String) row[3];
                String shelfLocation = (String) row[4];

                resultList.add(new PalletShelfDTO(palletId, palletName, shelfId, shelfName, shelfLocation));

            }
        } catch (Exception e) {
            System.err.println("Error fetching pallets and shelfs: " + e.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }

        return resultList;
    }

    public static ArrayList<Shelfs> getAllShelfs() {
        EntityManager em = emf.createEntityManager();
        ArrayList<Shelfs> shelfList = new ArrayList<>();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getAllShelfs", Shelfs.class);
            spq.execute();
            shelfList = new ArrayList<>(spq.getResultList());

        } catch (Exception e) {
            System.err.println("Error: " + e.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }

        return shelfList;
    }

    public ArrayList<Shelfs> getShelfsByStorageId(Integer storageId) {
        EntityManager em = emf.createEntityManager();
        ArrayList<Shelfs> shelfList = new ArrayList<>();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getShelfsByStorageId");
            spq.registerStoredProcedureParameter("storageId", Integer.class, ParameterMode.IN);
            spq.setParameter("storageId", storageId);
            spq.execute();

            List<Object[]> results = spq.getResultList();
            for (Object[] row : results) {
                Shelfs shelf = new Shelfs();
                shelf.setId((Integer) row[0]);
                shelf.setName((String) row[1]);
                shelf.setLocationInStorage((String) row[2]);
                shelf.setMaxCapacity((Integer) row[3]);
                shelf.setIsFull((Boolean) row[4]);
                shelfList.add(shelf);
            }

        } catch (Exception e) {
            System.err.println("Error fetching shelves by storage ID: " + e.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }

        return shelfList;
    }

    public Collection<PalletsXShelfs> getPalletsXShelfsCollection() {
        return palletsXShelfsCollection;
    }

    public void setPalletsXShelfsCollection(Collection<PalletsXShelfs> palletsXShelfsCollection) {
        this.palletsXShelfsCollection = palletsXShelfsCollection;
    }

    public Collection<Inventorymovement> getInventorymovementCollection() {
        return inventorymovementCollection;
    }

    public void setInventorymovementCollection(Collection<Inventorymovement> inventorymovementCollection) {
        this.inventorymovementCollection = inventorymovementCollection;
    }

    public Collection<Inventorymovement> getInventorymovementCollection1() {
        return inventorymovementCollection1;
    }

    public void setInventorymovementCollection1(Collection<Inventorymovement> inventorymovementCollection1) {
        this.inventorymovementCollection1 = inventorymovementCollection1;
    }

}
