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
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;

/**
 *
 * @author nidid
 */
@Entity
@Table(name = "movement_requests_x_pallets")
@NamedQueries({
    @NamedQuery(name = "MovementRequestsXPallets.findAll", query = "SELECT m FROM MovementRequestsXPallets m"),
    @NamedQuery(name = "MovementRequestsXPallets.findById", query = "SELECT m FROM MovementRequestsXPallets m WHERE m.id = :id"),
    @NamedQuery(name = "MovementRequestsXPallets.findByMovementRequestsId", query = "SELECT m FROM MovementRequestsXPallets m WHERE m.movementRequestsId = :movementRequestsId"),
    @NamedQuery(name = "MovementRequestsXPallets.findByPalletId", query = "SELECT m FROM MovementRequestsXPallets m WHERE m.palletId = :palletId")})
public class MovementRequestsXPallets implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Basic(optional = false)
    @Column(name = "id")
    private Integer id;
    @Basic(optional = false)
    @NotNull
    @Column(name = "movement_requests_id")
    private int movementRequestsId;
    @Basic(optional = false)
    @NotNull
    @Column(name = "pallet_id")
    private int palletId;

    public MovementRequestsXPallets() {
    }

    public MovementRequestsXPallets(Integer id) {
        this.id = id;
    }

    public MovementRequestsXPallets(Integer id, int movementRequestsId, int palletId) {
        this.id = id;
        this.movementRequestsId = movementRequestsId;
        this.palletId = palletId;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public int getMovementRequestsId() {
        return movementRequestsId;
    }

    public void setMovementRequestsId(int movementRequestsId) {
        this.movementRequestsId = movementRequestsId;
    }

    public int getPalletId() {
        return palletId;
    }

    public void setPalletId(int palletId) {
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
        if (!(object instanceof MovementRequestsXPallets)) {
            return false;
        }
        MovementRequestsXPallets other = (MovementRequestsXPallets) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.helixlab.raktarproject.model.MovementRequestsXPallets[ id=" + id + " ]";
    }
    
}
