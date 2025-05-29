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

/**
 *
 * @author nidid
 */
@Entity
@Table(name = "pallets_x_shelfs")
@NamedQueries({
    @NamedQuery(name = "PalletsXShelfs.findAll", query = "SELECT p FROM PalletsXShelfs p"),
    @NamedQuery(name = "PalletsXShelfs.findById", query = "SELECT p FROM PalletsXShelfs p WHERE p.id = :id")})
public class PalletsXShelfs implements Serializable {

    @JoinColumn(name = "shelf_id", referencedColumnName = "id")
    @ManyToOne
    private Shelfs shelfId;

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @JoinColumn(name = "pallet_id", referencedColumnName = "id")
    @ManyToOne
    private Pallets palletId;

    public PalletsXShelfs() {
    }

    public PalletsXShelfs(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Pallets getPalletId() {
        return palletId;
    }

    public void setPalletId(Pallets palletId) {
        this.palletId = palletId;
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
        if (!(object instanceof PalletsXShelfs)) {
            return false;
        }
        PalletsXShelfs other = (PalletsXShelfs) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.helixlab.raktarproject.model.PalletsXShelfs[ id=" + id + " ]";
    }

    public Shelfs getShelfId() {
        return shelfId;
    }

    public void setShelfId(Shelfs shelfId) {
        this.shelfId = shelfId;
    }
    
}
