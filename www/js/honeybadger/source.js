+(function($this){

	var $hb;

	var __init = function(_unsealed) {
		$hb = _unsealed;
	};

	$this.source = function(id){
		return {
			create:function(){},
			read:function(){},
			update:function(){},
			delete:function(){}
		};
	};
	return $this;
}(HoneyBadger||{}));