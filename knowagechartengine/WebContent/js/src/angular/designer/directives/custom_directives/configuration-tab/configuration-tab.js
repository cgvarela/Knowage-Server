/**
 * Knowage, Open Source Business Intelligence suite
 * Copyright (C) 2016 Engineering Ingegneria Informatica S.p.A.
 * 
 * Knowage is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Knowage is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


angular.module('configuration-tab', [])
.directive('configurationTab', function(sbiModule_config) {
	return {
		restrict: 'AE',
		replace:true,
		templateUrl: function(){
		      return sbiModule_config.contextName + '/js/src/angular/designer/directives/custom_directives/configuration-tab/configuration-tab.html' 
	      },   
		controller: configurationTabControllerFunction
	}
		
});

function configurationTabControllerFunction(sbiModule_translate,$scope,sbiModule_config,ChartDesignerData,$mdColorPalette,$mdColors, $mdColorUtil){

 $scope.translate = sbiModule_translate;
 $scope.configurationForDisplay = [];
 $scope.selectedConfigurationButton = "";
 $scope.fontObj = {
			fontFamily:"",
			fontSize:"",
			fontWeight:"",
			backgroundColor:"",
		 };
 $scope.titleFontObj = {
			fontFamily:"",
			fontSize:"",
			fontWeight:"",
			color:"",
			align:""
		 };
 $scope.subtitleFontObj = {
		 	fontFamily:"",
			fontSize:"",
			fontWeight:"",
			color:"",
			align:""
		 };
 
 $scope.nodataFontObj = {
		 	fontFamily:"",
			fontSize:"",
			fontWeight:"",
			color:"",
			align:""
		 };
 $scope.legendObj ={
	title:{
		fontFamily:"",
		fontSize:"",
		fontWeight:"",
		color:"",
		align:""
	},
	fontFamily:"",
	fontSize:"",
	fontWeight:"",
	color:"",
	align:"",
	borderWidth:"",
	backgroundColor:""	 
 }
 
 $scope.colorObj = {
		 gradient:"",
		 name:"",
		 order:"",
		 value:""
 }
 $scope.colorPickerOptions = {
		 format:'rgb',
		 swatch: true,
		 swatchPos: 'right'
 }
 $scope.presetColors = Object.keys($mdColorPalette);
 $scope.colors = $scope.chartTemplate.COLORPALETTE.COLOR;
 
 $scope.addColor = function(color) {
	var hex= $mdColorUtil.rgbaToHex($mdColors.getThemeColor(color));
	console.log(hex)
}
 
 $scope.templateUrls = ChartDesignerData.getTemplateURLs();
 
 $scope.dimensionMeasureType = ChartDesignerData.getDimensionMeasureTypeOptions();
 $scope.orientationType = ChartDesignerData.getOrientationTypeOptions();
 $scope.fontFamilyOptions = ChartDesignerData.getFontFamilyOptions();
 $scope.fontSizeOptions = ChartDesignerData.getFontSizeOptions();
 $scope.fontStyleOptions = ChartDesignerData.getFontStyleOptions();
 $scope.fontAlignOptions = ChartDesignerData.getAlignTypeOptions();
 $scope.tooltipBreadcrumbValueType = ChartDesignerData.getTooltipBreadcrumbValueTypeOptions();
 $scope.positionType = ChartDesignerData.getPositionTypeOptions();
 
 
 $scope.openConfigurationDetails = function(button) {
	 console.log(button);
	 $scope.selectedConfigurationButton = button;
}
 
 
}

