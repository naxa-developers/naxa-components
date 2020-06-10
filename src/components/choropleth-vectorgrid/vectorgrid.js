import React, { Component } from "react";
import L from "leaflet";
import "leaflet.vectorgrid";
import "leaflet.vectorgrid/dist/Leaflet.VectorGrid.bundled";
// import ScrollTab from './ScrollTab';
import './choropleth-vectorgrid.css';
import {label_Vector_Tiles, calculateRange, handleZoom, choroplethColorArray, getProvinceName} from "./Functions";

var map = {};
var vt_label_province = L.featureGroup();
var labelcount = 0;
var province;
var circleLoad = true;

const defaultData = {
    choroplethData: [{id:1, count:1}, {id:2, count:2}, {id:3, count:3}, {id:4, count:4}, {id:5, count:5}, {id:6, count:6}, {id:7, count:7}],
}
var provinceDefaultStyle = {
    fillColor: "white",
    fillOpacity: 0,
    weight: 1.5,
    opacity: 1,
    color: "#a3b7e3",
    fill: true
  };
  

class VectorGridComponent extends Component {
    constructor(props) {
        super(props);
        this.state = {
            provinceCounts:[],
            provinceCenters: [
                [27.176469131898898, 87.220458984375],
                [27.01998400798257, 85.6494140625],
                [27.712710260887476, 85.36376953125001],
                [28.362401735238237, 84.03442382812501],
                [28.04289477256162, 82.78198242187501],
                [29.15216128331894, 82.22167968750001],
                [29.36302703778376, 80.97148437500001]
              ],
            choroplethTitle: "dataCategory1",
            grade: [],
            legendColors: [],
            //province: null
        };
        this.infoDivRef = React.createRef();

        this.getLegendColor = this.getLegendColor.bind(this);
        this.changeGrades = this.changeGrades.bind(this);
        this.ChangeLegendColors = this.ChangeLegendColors.bind(this);
        this.setChoroplethStyle = this.setChoroplethStyle.bind(this);
        this.getShortNumbers = this.getShortNumbers.bind(this);
        this.label = this.label.bind(this);
        // this.addMouseoverLayer = this.addMouseoverLayer.bind(this);

    }

    getLegendColor(value) {
        var colorArray = this.props.colorArray;
        var legendColor = colorArray!=null && colorArray.length>0?colorArray:this.state.legendColors;
        var color = "#f4f4f2";
        // console.log(colorArray, "colorArray inside")
        this.state.grade.map((grade,j) => {
            if(value>grade){
                color = legendColor[j];
            }
        })
        return color;
    }

    changeGrades(){
        var range = [];
        var data = [];
        
        var colorArrayLength = this.props.colorArray && this.props.colorArray.length;
        var gradeCount = this.props.legendDivisions!=null && typeof(this.props.legendDivisions) == "number" && this.props.legendDivisions <= 20 && this.props.legendDivisions >= colorArrayLength?this.props.legendDivisions:7; //set default gradecount
        
        var fullRange = this.props.divisions && this.props.divisions.length>0?this.props.divisions:[];
        var fullData = this.props.choroplethData!=null && this.props.choroplethData.length>0?this.props.choroplethData:defaultData.choroplethData;
        
        this.props.choroplethData!=null && this.props.choroplethData.length>0?this.props.choroplethData.map(data1 => {
            data.push(data1.count);
        }):defaultData.choroplethData.map(data1 => {
            data.push(data1.count);//if no dat passed take from default data
        })

            // console.log(data, "data new")
            var max = Math.max.apply(null, Object.values(data));
            var min = 0;//Math.min(...data);
            // console.log(max, "max")
            // console.log(min, "min")
            range = (max-min)/(gradeCount-1)<1?[0,2,4,6,8,10,12]:calculateRange(min, max, (max-min)/(gradeCount-1));
            // console.log(range, "range")
            this.setState({grade:fullRange.length>0?fullRange:range}) //add grade provided from props if available
            
            setTimeout(() => {
                this.ChangeLegendColors();
                this.setChoroplethStyle(province, fullData);
            }, 200);
    }
    ChangeLegendColors(){
        var choroplethColor = this.props.color;
        var color = choroplethColor!=undefined && choroplethColor.length>0?choroplethColor:"#ff0000";
        var data = this.state.grade;
        var choroplethColors = choroplethColorArray(data.length, color);
        // console.log(choroplethColors, "legendcolors")
        this.setState({legendColors:choroplethColors})
            
    }

    setChoroplethStyle(layer, values){
        values.map((value) => {
            var color = this.getLegendColor(value.count);
            var newStyle= {};
            var newStyle1 = this.props.style && this.props.style != null?this.props.style:provinceDefaultStyle;
            Object.assign(newStyle, newStyle1)
            newStyle.fillColor = color;
            // newStyle.fillOpacity = 0.7;
            // console.log(color, "color")
            console.log(newStyle, "newStyle")
            setTimeout(() => {
                layer.setFeatureStyle(value.id, newStyle);
            }, 100);
        })
    }

    getShortNumbers(n,d){
        var x=(''+n).length;
        var p=Math.pow;
        d=p(10,d)
        x-=x%3
        return Math.round(n*d/p(10,x))/d+" kMGTPE"[x/3]
    }

    label(){
        //province = this.state.province;
            map = this.props.mapRef.current.leafletElement;
            if(circleLoad == true){
                var feature = {properties:{}}
                this.state.provinceCenters.map((data, i) => {
                    feature.properties.id = i;
                    feature.properties.Centroid_X = data[1];
                    feature.properties.Centroid_Y = data[0];
                    feature.properties.PROV_NAME = null;
                    if(this.props.label && this.props.label == true){
                        label_Vector_Tiles(feature, vt_label_province, labelcount, this.props.provinceCounts);
                    }
                })
            }
            map.on("zoomend", (e)=>{
                if(this.props.label && this.props.label == true){
                    handleZoom(map, province, vt_label_province);
                }
            });
            circleLoad = false;
    }
    
    addMouseoverLayer(){
        //province = this.state.province;
        console.log(province, "province123")
        var infoDiv = this.infoDivRef.current;
        map = this.props.mapRef.current.leafletElement;
        province.on("mouseover",(e)=>{
            console.log(e, "ee")
            infoDiv.style.display = "block";
            var provName = "";
            // console.log(provName, "provName")
            var level = "";
            if(e.layer.properties.FIRST_PROV!=undefined && e.layer.properties.FIRST_PROV!=null){
                level = "province";
                provName = getProvinceName(e.layer.properties.id, "en")
            }
            else if(e.layer.properties.FIRST_DISTRICT!=undefined && e.layer.properties.FIRST_DISTRICT!=null){
                level = "district"
                provName = getProvinceName(e.layer.properties.provinceId, "en")
            }
            else {
                level = "municipality"
                provName = getProvinceName(e.layer.properties.provinceId, "en")
            }
            var html = `<div style="background: white;padding: 10px;"><span><b>${
                level == "province"?provName:level == "district"?e.layer.properties.FIRST_DISTRICT:e.layer.properties.Name
              }</b></span>`; 
            html+= level != "province"?`,</br><span style="    text-transform: capitalize;">${level=="district"?provName:e.layer.properties.District.toLowerCase()}`:"";
            html+= level != "province" && level != "district"?`, ${provName}</span></div>`:"";
            infoDiv.innerHTML = html;
        });

        province.on("mouseout",(e)=>{
            infoDiv.style.display = "none";
            infoDiv.innerHTML = "";
        })

    }

    componentWillMount(){
        map = this.props.mapRef.current.leafletElement;

        console.log(map , "map in vectorgridjs")

        var style = this.props.style && this.props.style != null?this.props.style:provinceDefaultStyle;
          var vectorTileOptions = {
            vectorTileLayerStyles: {
              Province: style,
            },
            //pane: "wmsPane",
            interactive: true,
            rendererFactory: L.canvas.tile,
            tms: true,
            getFeatureId: function(feature) {
              //console.log("f   ", f);
              return feature.properties.id;
            }
          };
          const provinceUrl = this.props.vectorGridUrl && this.props.vectorGridUrl != "" && typeof(this.props.vectorGridUrl) == "string"?this.props.vectorGridUrl:"https://geoserver.naxa.com.np/geoserver/gwc/service/tms/1.0.0/Bipad:Province@EPSG%3A900913@pbf/{z}/{x}/{-y}.pbf";
      
          province = L.vectorGrid.protobuf(provinceUrl, vectorTileOptions).addTo(map);
          //this.setState({province: province})
    }

    componentDidMount(){
        map = this.props.mapRef.current.leafletElement;
        map.addLayer(vt_label_province);
        this.changeGrades();
        this.label();
        this.addMouseoverLayer();

    }

    componentDidUpdate(prevProps, prevState){    
    }

    render() {
        return (
            <div>
                <div style={{position: "absolute", display: this.props.legend?"flex":"none", flexDirection: "column", zIndex: 1999, background: "white", padding: 5, bottom: 0, margin: 5}}>
                <div>{this.props.choroplethTitle?this.props.choroplethTitle:"Legend"}</div>
                <div class="map-legend">
                            {/* <ScrollTab changetheme={this.props.changetheme}/> */}
                            <ul class="color-legend">
                    {
                        this.state.grade && this.state.grade.map((grade,i) => {
                            var hideLastdiv = false;
                            hideLastdiv= i == (this.state.grade.length-1)?true:false;
                            var grade1 = grade<1000?grade.toString():this.getShortNumbers(grade,1);
                            // uncomment this to add vertical legend
                            // return <div><div style={{width:"12px", height:"12px", backgroundColor: this.getLegendColor(this.state.grade[i] + 1), border:"solid 1px #e2e2e2", display:"inline-block"}}></div> <span>{this.state.grade[i]} {this.state.grade[i + 1]?"-"+this.state.grade[i + 1]: "+"}</span></div>
                            // uncomment this to add horizontal legend
                            // return <div style={{display:"inline-block"}}><div style={{width:"12px", height:"12px", backgroundColor: this.getLegendColor(this.state.grade[i] + 1), border:"solid 1px #e2e2e2", display:"inline-block", marginLeft:"5px"}}></div> <span >{this.state.grade[i]} {this.state.grade[i + 1]?"-"+this.state.grade[i + 1]: "+"}</span></div>
                            // uncomment this to add nice horizontal legend
                            return (
                                <li>
                                    <div style={{backgroundColor: hideLastdiv?"transparent":this.getLegendColor(grade+1)}} class="color color1"></div>
                                    <span style={{marginLeft: grade1.trim().length==1?-2:grade1.trim().length==2?-8:-12}}>{grade1}</span>
                                </li>
                            )
                        })
                    }
                        </ul>
                    </div>
                </div>
                <div ref={this.infoDivRef} class="infoDiv" style={{display:"none"}}></div>
            </div>
        )
    }
}
export default VectorGridComponent;