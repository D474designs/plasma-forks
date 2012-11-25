
function AIManager() {
	var v1 = new THREE.Vector3();
	var v2 = new THREE.Vector3();
	var turnGain = 10;

	function walkTowards(monster, pos, sq_thres) {
		// Get monster's look vector in world space
		monster.updateMatrixWorld();
		monster.matrixRotationWorld.extractRotation(monster.matrixWorld);
		monster.matrixRotationWorld.multiplyVector3(v1.set(0, 0, 1));
		// Calculate target vector
		v2.copy(pos);
		v2.subSelf(monster.position);
		v2.y = 0;
		v2.normalize();
		// Difference in angle
		var angleTo = Math.atan2(v1.z, v1.x) - Math.atan2(v2.z, v2.x);
		if (angleTo > Math.PI) angleTo -= Math.PI * 2;
		console.log(angleTo);
		// Set angular speed
		var turnSpeed = angleTo * turnGain;
		monster.setAngularVelocity(v1.set(0, turnSpeed, 0));
		// Linear speed and distance considerations
		if (monster.position.distanceToSquared(pos) >= sq_thres) {
			monster.setLinearVelocity(v2.multiplyScalar(monster.speed));
			if (monster.mesh) monster.mesh.animate = true;
			return false;
		} else {
			monster.setLinearVelocity(v2.set(0, 0, 0));
			if (monster.mesh) monster.mesh.animate = false;
			return true;
		}
	}

	this.process = function() {
		var i, j;
		var gridSize = dungeon.level.gridSize;
		// TODO: Should probably keep own collection
		for (i = 0; i < dungeon.monsters.length; ++i) {
			var monster = dungeon.monsters[i];
			if (monster.dead) continue;

			// Does the monster see player?
			if (dungeon.level.map.raycast(
				monster.position.x / gridSize, monster.position.z / gridSize,
				pl.position.x / gridSize, pl.position.z / gridSize))
			{
				// Mark as active
				monster.activated = true;
				monster.waypoints = null; // Clear waypoints
				// Look at player
				walkTowards(monster, pl.position, 12);
				// Shoot?
				if (Math.random() < 0.333) {
					shoot("plain", monster.faction, monster.position, monster.rotation, v1.set(0, 0.11, -1.2), true);
				}

			// Target lost? Let's find a path
			} else if (monster.activated && !monster.waypoints) {
				var path = dungeon.pathFinder.findPath(
					(monster.position.x / gridSize)|0, (monster.position.z / gridSize)|0,
					(pl.position.x / gridSize)|0, (pl.position.z / gridSize)|0,
					dungeon.grid.clone());
				monster.waypoints = [];
				//path = PF.Util.smoothenPath(dungeon.grid, path);
				for (j = 0; j < path.length; ++j) {
					v1.set((path[j][0] + 0.5) * gridSize, monster.position.y, (path[j][1] + 0.5) * gridSize);
					monster.waypoints.push(v1.clone());
				}
			}

			// Does the monster have waypoints?
			if (monster.waypoints) {
				if (!monster.waypoints.length)
					monster.waypoints = null;
				else if (walkTowards(monster, monster.waypoints[0], 1)) {
					// Move on to the next waypoint
					monster.waypoints.splice(0, 1);
				}
			}
		}
	};

}



