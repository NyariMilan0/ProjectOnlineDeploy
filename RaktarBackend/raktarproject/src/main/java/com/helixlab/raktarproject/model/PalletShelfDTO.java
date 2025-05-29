package com.helixlab.raktarproject.model;

public class PalletShelfDTO {
    private Integer palletId;
    private String palletName;
    private Integer shelfId;
    private String shelfName;
    private String shelfLocation;

    public PalletShelfDTO(Integer palletId, String palletName, Integer shelfId, String shelfName, String shelfLocation) {
        this.palletId = palletId;
        this.palletName = palletName;
        this.shelfId = shelfId;
        this.shelfName = shelfName;
        this.shelfLocation = shelfLocation;
    }

    // Getterek és setterek
    public Integer getPalletId() { return palletId; }
    public void setPalletId(Integer palletId) { this.palletId = palletId; }

    public String getPalletName() { return palletName; }
    public void setPalletName(String palletName) { this.palletName = palletName; }

    public Integer getShelfId() { return shelfId; }
    public void setShelfId(Integer shelfId) { this.shelfId = shelfId; }

    public String getShelfName() { return shelfName; }
    public void setShelfName(String shelfName) { this.shelfName = shelfName; }

    public String getShelfLocation() { return shelfLocation; }
    public void setShelfLocation(String shelfLocation) { this.shelfLocation = shelfLocation; }
}