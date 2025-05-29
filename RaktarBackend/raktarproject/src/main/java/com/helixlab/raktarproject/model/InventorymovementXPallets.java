/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.helixlab.raktarproject.model;

import java.io.Serializable;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;
import javax.validation.constraints.Size;

/**
 *
 * @author nidid
 */
@Entity
@Table(name = "inventorymovement_x_pallets")
@NamedQueries({
    @NamedQuery(name = "InventorymovementXPallets.findAll", query = "SELECT i FROM InventorymovementXPallets i"),
    @NamedQuery(name = "InventorymovementXPallets.findById", query = "SELECT i FROM InventorymovementXPallets i WHERE i.id = :id"),
    @NamedQuery(name = "InventorymovementXPallets.findByPalletId", query = "SELECT i FROM InventorymovementXPallets i WHERE i.palletId = :palletId"),
    @NamedQuery(name = "InventorymovementXPallets.findByActionType", query = "SELECT i FROM InventorymovementXPallets i WHERE i.actionType = :actionType")})
public class InventorymovementXPallets implements Serializable {

    @JoinColumn(name = "inventory_id", referencedColumnName = "id")
    @ManyToOne
    private Inventorymovement inventoryId;

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Column(name = "pallet_id")
    private Integer palletId;
    @Size(max = 6)
    @Column(name = "action_type")
    private String actionType;

    public InventorymovementXPallets() {
    }

    public InventorymovementXPallets(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getPalletId() {
        return palletId;
    }

    public void setPalletId(Integer palletId) {
        this.palletId = palletId;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
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
        if (!(object instanceof InventorymovementXPallets)) {
            return false;
        }
        InventorymovementXPallets other = (InventorymovementXPallets) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.helixlab.raktarproject.model.InventorymovementXPallets[ id=" + id + " ]";
    }

    public Inventorymovement getInventoryId() {
        return inventoryId;
    }

    public void setInventoryId(Inventorymovement inventoryId) {
        this.inventoryId = inventoryId;
    }
    
}
