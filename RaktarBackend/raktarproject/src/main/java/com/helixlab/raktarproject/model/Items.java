package com.helixlab.raktarproject.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.EntityManagerFactory;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.Id;
import javax.persistence.Lob;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.OneToMany;
import javax.persistence.Persistence;
import javax.persistence.StoredProcedureQuery;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Entity
@Table(name = "items")
@NamedQueries({
    @NamedQuery(name = "Items.findAll", query = "SELECT i FROM Items i"),
    @NamedQuery(name = "Items.findById", query = "SELECT i FROM Items i WHERE i.id = :id"),
    @NamedQuery(name = "Items.findBySku", query = "SELECT i FROM Items i WHERE i.sku = :sku"),
    @NamedQuery(name = "Items.findByType", query = "SELECT i FROM Items i WHERE i.type = :type"),
    @NamedQuery(name = "Items.findByName", query = "SELECT i FROM Items i WHERE i.name = :name"),
    @NamedQuery(name = "Items.findByAmount", query = "SELECT i FROM Items i WHERE i.amount = :amount"),
    @NamedQuery(name = "Items.findByPrice", query = "SELECT i FROM Items i WHERE i.price = :price"),
    //@NamedQuery(name = "Items.findByItemState", query = "SELECT i FROM Items i WHERE i.itemState = :itemState"),
    //@NamedQuery(name = "Items.findByTransactionTimestamp", query = "SELECT i FROM Items i WHERE i.transactionTimestamp = :transactionTimestamp"),
    @NamedQuery(name = "Items.findByWeight", query = "SELECT i FROM Items i WHERE i.weight = :weight"),
    @NamedQuery(name = "Items.findBySize", query = "SELECT i FROM Items i WHERE i.size = :size")})
public class Items implements Serializable {

    // @Max(value=?)  @Min(value=?)//if you know range of your decimal fields consider using these annotations to enforce field validation
    @Column(name = "price")
    private Double price;
    @Column(name = "weight")
    private Double weight;
    @Column(name = "size")
    private Double size;
    @OneToMany(mappedBy = "itemId")
    private Collection<PalletsXItems> palletsXItemsCollection;

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @NotNull
    @Column(name = "id")
    private Integer id;
    @Size(max = 255)
    @Column(name = "sku")
    private String sku;
    //@Size(max = 18)
    //@Column(name = "type")
    //private String type;
    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private Material type;
    @Size(max = 255)
    @Column(name = "name")
    private String name;
    @Column(name = "amount")
    private Integer amount;
    //@Size(max = 11)
    //@Column(name = "itemState")
    //private String itemState;
    //@Basic(optional = false)
    //@NotNull
    //@Column(name = "transactionTimestamp")
    //@Temporal(TemporalType.TIMESTAMP)
    //private Date transactionTimestamp;
    @Lob
    @Size(max = 65535)
    @Column(name = "description")
    private String description;

    static EntityManagerFactory emf = Persistence.createEntityManagerFactory("com.helixLab_raktarproject_war_1.0-SNAPSHOTPU");

    public Items() {
    }

    public Items(Integer id) {
        EntityManager em = emf.createEntityManager();

        try {
            Items i = em.find(Items.class, id);

            this.id = i.getId();
            this.sku = i.getSku();
            this.type = i.getType();
            this.name = i.getName();
            this.amount = i.getAmount();
            this.price = i.getPrice();
            this.weight = i.getWeight();
            this.size = i.getSize();
            this.description = i.getDescription();

        } catch (Exception e) {
            System.err.println("Error: " + e.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }
    }

    public Items(Integer id, String sku, Material type, String name, Integer amount, double price, double weight, double size, String description) {
        this.id = id;
        this.sku = sku;
        this.type = type;
        this.name = name;
        this.amount = amount;
        this.price = price;
        this.weight = weight;
        this.size = size;
        this.description = description;
    }

    public Items(Integer id, Date transactionTimestamp) {
        this.id = id;
        
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Material getType() {
        return type;
    }

    public void setType(Material type) {
        this.type = type;
    }
    

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getAmount() {
        return amount;
    }

    public void setAmount(Integer amount) {
        this.amount = amount;
    }

    //public String getItemState() {
    //    return itemState;
    //}

    //public void setItemState(String itemState) {
    //    this.itemState = itemState;
    //}

    //public Date getTransactionTimestamp() {
    //    return transactionTimestamp;
    //}

    //public void setTransactionTimestamp(Date transactionTimestamp) {
    //    this.transactionTimestamp = transactionTimestamp;
    //}

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
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
        if (!(object instanceof Items)) {
            return false;
        }
        Items other = (Items) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.helixlab.raktarproject.model.Items[ id=" + id + " ]";
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Double getSize() {
        return size;
    }

    public void setSize(Double size) {
        this.size = size;
    }

    public Collection<PalletsXItems> getPalletsXItemsCollection() {
        return palletsXItemsCollection;
    }

    public void setPalletsXItemsCollection(Collection<PalletsXItems> palletsXItemsCollection) {
        this.palletsXItemsCollection = palletsXItemsCollection;
    }

    public static void addItem(String sku, String type, String name, Integer amount, Double price, Double weight, Double size, String description) {
        EntityManager em = emf.createEntityManager();

        try {
            em.getTransaction().begin();

            StoredProcedureQuery spq = em.createStoredProcedureQuery("addItem");
            spq.registerStoredProcedureParameter("skuIn", String.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("typeIn", String.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("nameIn", String.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("amountIn", Integer.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("priceIn", Double.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("weightIn", Double.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("sizeIn", Double.class, javax.persistence.ParameterMode.IN);
            spq.registerStoredProcedureParameter("descriptionIn", String.class, javax.persistence.ParameterMode.IN);

            spq.setParameter("skuIn", sku);
            spq.setParameter("typeIn", type); // Ez lesz konvertálva Material-ra a service vagy controller rétegben
            spq.setParameter("nameIn", name);
            spq.setParameter("amountIn", amount);
            spq.setParameter("priceIn", price);
            spq.setParameter("weightIn", weight);
            spq.setParameter("sizeIn", size);
            spq.setParameter("descriptionIn", description);

            spq.execute();

            em.getTransaction().commit();
        } catch (Exception e) {
            if (em.getTransaction().isActive()) {
                em.getTransaction().rollback();
            }
            System.err.println("Error adding item: " + e.getLocalizedMessage());
            throw new RuntimeException("Failed to add item", e);
        } finally {
            em.clear();
            em.close();
        }
    }

    public static List<Items> getItemList() {
        EntityManager em = emf.createEntityManager();
        List<Items> itemList = new ArrayList<>();

        try {
            StoredProcedureQuery spq = em.createStoredProcedureQuery("getItemList", Items.class);
            spq.execute();

            itemList = spq.getResultList();
        } catch (Exception e) {
            System.err.println("Error fetching item list: " + e.getLocalizedMessage());
        } finally {
            em.clear();
            em.close();
        }

        return itemList;
    }

}
