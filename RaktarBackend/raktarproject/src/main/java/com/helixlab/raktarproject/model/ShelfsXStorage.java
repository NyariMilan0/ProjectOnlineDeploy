package com.helixlab.raktarproject.model;

import java.io.Serializable;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQueries;
import javax.persistence.NamedQuery;
import javax.persistence.Table;
import javax.validation.constraints.NotNull;


@Entity
@Table(name = "shelfs_x_storage")
@NamedQueries({
    @NamedQuery(name = "ShelfsXStorage.findAll", query = "SELECT s FROM ShelfsXStorage s"),
    @NamedQuery(name = "ShelfsXStorage.findById", query = "SELECT s FROM ShelfsXStorage s WHERE s.id = :id")})
public class ShelfsXStorage implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @Basic(optional = false)
    @NotNull
    @Column(name = "id")
    private Integer id;
    @JoinColumn(name = "storage_id", referencedColumnName = "id")
    @ManyToOne
    private Storage storageId;
    @JoinColumn(name = "shelf_id", referencedColumnName = "id")
    @ManyToOne
    private Shelfs shelfId;

    public ShelfsXStorage() {
    }

    public ShelfsXStorage(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Storage getStorageId() {
        return storageId;
    }

    public void setStorageId(Storage storageId) {
        this.storageId = storageId;
    }

    public Shelfs getShelfId() {
        return shelfId;
    }

    public void setShelfId(Shelfs shelfId) {
        this.shelfId = shelfId;
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
        if (!(object instanceof ShelfsXStorage)) {
            return false;
        }
        ShelfsXStorage other = (ShelfsXStorage) object;
        if ((this.id == null && other.id != null) || (this.id != null && !this.id.equals(other.id))) {
            return false;
        }
        return true;
    }

    @Override
    public String toString() {
        return "com.helixlab.raktarproject.model.ShelfsXStorage[ id=" + id + " ]";
    }

}
