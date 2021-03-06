(function(ang, g) {

    'use strict';
    ang.module('ang-google-maps', [])
        .factory('Map', function() { return MapFactory; })
        .factory('GetPosition', function() { return GetPosition; })
        .factory('GetMarker', function() { return GetMarker; })
        .factory('Geocode', function() { return Geocode(); })
        .factory('Direction', ['$q', '$rootScope', function($q, $rootScope) { 

            var $DirectionService = new g.maps.DirectionsService,
                $DirectionDisplay = new g.maps.DirectionsRenderer({
                    draggable: true
            });
            
            
            $DirectionDisplay.addListener('directions_changed', function(res) { 
                
                var $Directions = this.directions,
                    $Map = this.map,
                    $Leg = $Directions.routes[0].legs[0];
                
                if (typeof $Map.ondirectionchange == 'function') $Map.ondirectionchange($Leg, function($scope) {
                    //$rootScope.digest();
                    if ($scope) $scope.$digest();
                });

            });

            return Direction({
                $DirectionService: $DirectionService,
                $DirectionDisplay: $DirectionDisplay
            });

        }])
        .directive('mapTemp', ['$window', '$document', '$http', mapTempFactory])
        .directive('autoCompleteTemp', ['$window', '$http', '$rootScope', autoCompleteTempFactory]);

    /**
      * Factory of google map's marker
      */
    function MapFactory(options) {

        var $Map = new g.maps.Map(
            document.getElementById('main-map'),
            options
        );
        
        return $Map;

    }
    
    /**
      * Factory of google map's marker
      */
    function GetMarker(options) {

        return new g.maps.Marker({
            map: options['map'] || null,
            draggable: true,
            animation: google.maps.Animation.DROP || '',
            title: options['title'] || '',
            position: { lat: options['lat'], lng: options['lng'] }
        });

    };

    /**
      * Factory of google map's position
      *
      * @param {Float} lat
      * @param {Float} lng
      */
    function GetPosition(lat, lng) {
        return new g.maps.LatLng(lat || 0, lng || 0);
    }

    /**
      * Creates the factory of mapTemp.
      *
      * @param {Object} $window
      * @param {Object} $http
      */
    function mapTempFactory($window, $document, $http) {

        return {

            controller: mapTempCtrl,
            link: mapTempLink,
            scope: {
                id: "=id",
                configs: "=configs",
                oncenterchange: "=oncenterchange",
                ondirectionchange: "=ondirectionchange"
            },
            template: '<div class="filter" ng-transclude=""></div>',
            transclude: true,

        };

    }

    /**
      * Creates the factory of autoCompleteTemp.
      *
      * @param {Object} $window
      * @param {Object} $http
      */
    function autoCompleteTempFactory($window, $http, $rootScope) {

        return {

            controller: autoCompleteTempCtrl,
            link: function($scope, element, $atts, $ctrls) {
                
                autoCompleteTempLink.call(this, $scope, element, $atts, $ctrls, $rootScope);
                
            },
            scope: {
                map: '=map',
                model: '=model',
                onfill: '=onfill',
                ondrop: '=ondrop'
            }

        };

    }

    /**
      * Handles map-temp directive's controller
      *
      * @param {Object} $scope
      */
    function mapTempCtrl($scope, GetPosition) {

        $scope.mapOptions = {
            center: {
                lat: parseFloat($scope.configs.lat),
                lng: parseFloat($scope.configs.lng),
            },
            zoom: $scope.configs.zoom || 18
        };

        $scope.createMapContainer = createMapContainer;

    }

    /**
      * Handles map-temp directive's link
      *
      * @param {Object} $scope
      * @param {Object} element
      * @param {Object} attrs
      * @param {Array} ctlrs
      */
    function mapTempLink($scope, element, attrs, ctrls) {
        
        // Append map's container into element element
        $scope.mapContainer = $scope.createMapContainer();

        element[0].appendChild($scope.mapContainer);

        initMap.call($scope, element);

    }

    /**
      * Creates map's container
      *
      * @return {Object} div
      */
    function createMapContainer() {

        var div = document.createElement('div');

        // Set the class
        div.className = "container";
        div.setAttribute('id', this.configs.id || '');

        return div;

    }

    /**
      * Initializes Google map into map's content.
      *
      */
    function initMap(element) {
        
        console.log("Line 186");
        console.log(this);
        
        console.log(this);
        
        this.$parent.map = this.map = new g.maps.Map(this.mapContainer, this.mapOptions);
        
        this.map.markers = [];
        this.map.id = this.configs.id;
        this.map.location = {};
        this.map.ondirectionchange = this.ondirectionchange || undefined;
        //this.map.location = 
        
        this.initMarkers = function() {
            
            for (var index = 0, length = this.configs.markers.length; index < length; index++) {
                this.map.markers.push(this.configs.markers[index]);
            }
            
            return this.map.markers;
            
        };

        this.initMarkers();

        attachMapEvents.call(this);

    }

    function attachMapEvents() {
        
        var self = this;
        
        /*
        this.map.addListener('bounds_changed', function($Event) {
            
            console.log("Bounds have changed");
                        
            if(typeof self['onboundschanged'] == 'function') self.onboundschanged({
                $Event: $Event,
                $Map: self.map
            });
            
        });
        */
        
    }

    /**
      * Handles auto-complete-temp directive's controller
      *
      * @param {Object} $scope
      */
    function autoCompleteTempCtrl($scope) {
        $scope.fillInAdress = fillInAdress; 
        $scope.model = $scope.model || {};        
    }

    /**
      * Handles auto-complete-temp directive's link
      *
      * @param {Object} $scope
      * @param {Object} element
      * @param {Object} attrs
      * @param {Array} ctlrs
      */
    function autoCompleteTempLink($scope, element, attrs, ctrls, $rootScope) {

        // Create autocomplete object
        $scope.autocomplete = new g.maps.places.Autocomplete(
            // Dom element
            element[0] || null,
            // Type
            { type: 'geocode' }
        );
        
        $scope.element = element[0];
        
        $rootScope[$scope.model['name']] = '';

        $scope.$parent.$watch($scope.model['name'], function(newValue, oldValue) {

            console.log("Changing on it's value");
            console.log(arguments);
            $scope.element.value = newValue;
            return newValue;

        }).bind($scope.$parent);

        //$scope[$scope.model['name']] = 'Khaled';

        // Attach an event into autocomplete
        g.maps.event.addListener($scope.autocomplete, 'place_changed', function() {
            $scope.fillInAdress();
        });

    }
    
    function findInList(List, $Obj) {
        
        var List = List || [],
            $Obj = $Obj || {key: null, value: null};
        
        for (var index = 0, length = List.length; index < length; index++) {

            if ( List[index][$Obj['key']] == $Obj['value'] ) return index;
            
        }
        
        return undefined;
        
    }
    
    function extendObj($Obj, $NewObj) {
        
        var $FormedObj = {};

        for (var item in $NewObj) {

            $FormedObj[item] = $NewObj[item];
            
        }
        
        for (var item in $Obj) {
            $FormedObj[item] = $Obj[item];
        }
        
        return $FormedObj;
        
    }
    
    function appendMarker(List, model) {
        
        var position = findInList(List || [], {key: 'name', value: model['name']});

        if (position != undefined) {
            List[position] = extendObj(List[position], model);
        } else { List.push(model); }

    }

    function fillInAdress() {

        var place = this.autocomplete.getPlace(),
            lat = place.geometry.location.G,
            lng = place.geometry.location.K,
            $CtrlScope = this.$parent,
            $Self = this,
            $Position = GetPosition(lat, lng);
        
        if ( !($Self['model']) ) $Self.model = { label: '', name: '', show: 0 };
        
        $Self.map.setCenter($Position);

        // Drop pin
        if(!$Self.model.marker) {
            $Self.model.marker = GetMarker({
                map: $Self.map,
                lat: lat,
                lng: lng,
                title: $Self['model']['name']
            });
        } else {
            $Self.model.marker.setPosition({
                lat: lat,
                lng: lng
            });   
        }

        $Self.model.marker.addListener('dragend', function($Event) {

            console.log("Dragging is ended ...");
            console.log($Event);
            
            if(typeof $Self.ondrop == 'function') $Self.ondrop($Event, $Self.model, $Self);
            
        });       
        
        /*
        $Self.model.marker.addListener('click', function($Event) {
            handleMakerClick.call($Self, $Event);
        });
        */
        
        // Push a new marker into markers list
        appendMarker($Self.map.markers, $Self.model);

        if(typeof $Self.onfill == 'function') $Self.onfill($Position, $Self.model, place, $Self.element);
        

    }

    function clearAllMarkers($map) {

        var $Markers = $map.markers || [];
        
        
        for (var index = 0, length = $Markers.length; index < length; index++) {
            if('marker' in $Markers[index]) $Markers[index]['marker'].setMap(null);
        }

    }
    
    function handleMakerClick($Event) {

        this.$InfoWindow = new g.maps.InfoWindow({
            content: this.model.name || ''
        });
        
        this.$InfoWindow.open(this.map, this.model.marker);
        
    }
    
    function Direction(configs) {

        var $DirectionService = configs['$DirectionService'],
            $DirectionDisplay = configs['$DirectionDisplay'];
        
        return {

            setRoute : function(options) {

                if (options['map']) {

                    clearAllMarkers(options['map']);

                    if (!$DirectionDisplay.getMap()) $DirectionDisplay.setMap(options['map']);

                    $DirectionService.route({

                        destination: options['destination'] || 0,
                        origin: options['current'] || 0,
                        travelMode: google.maps.TravelMode.DRIVING

                    }, function(response, status) {

                        if (status == g.maps.DirectionsStatus.OK) {
                            // Display the route on the map.
                            console.log("OK Setting Route");
                            console.log(response);
                            $DirectionDisplay.setDirections(response);
                        }

                    });
                    
                }
                
            }

        };
        
    }

}(angular, google));
