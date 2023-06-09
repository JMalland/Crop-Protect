ll.registerPlugin("Crop Protect", "Make crops easier to farm, and prevent accidential destruction.", [2,4,0], {"Author": "JTM"})
var crops = {}
var items = {}

initializeConfigs() // Create the initial config Objects
log("Loaded CropProtect configuration files")
initializeListeners() // Create the event listeners to run the plugin
log("Loaded CropProtect event listeners")

log("Crops:")
log(crops)
log("Items:")
log(items)

// Make it so redstone can be used to harvest crops?

// Have right-click harvest configuration per item used

function debug(message) {
    if (config.get("debug") == true) { // Debugging is enabled
        log(" [DEBUG] " + message)
    }
}

function includes(list, pos) {
    for (let item of list) {
        if (item.x == pos.x && item.y == pos.y && item.z == pos.z && item.dimid == pos.dimid) {
            return(true);
        }
    }
    return(false);
}

function breakCrop(crop, block) {
    let nbt = block.getNbt() // Store the block Nbt
    let state = nbt.getTag("states") // Store the block state as an NbtCompound
    if (crop.growth > state.getTag("growth") || crop.growth > state.getTag("age")) { // Crop isn't fully grown
        return(false) // Did not break the crop
    }
    block.destroy(true) // Break the crop
    if (!crop.replant) { // Should not replant
        return(true) // Did break the crop
    }
    if (state.getKeys().includes("age")) state.setTag("age", new NbtInt(0)) // Reset the block's age
    if (state.getKeys().includes("growth")) state.setTag("growth", new NbtInt(0)) // Reset the block's growth
    nbt.setTag("states", state) // Update the 'states' tag of the Nbt (means the Nbt is an NbtCompound)
    block.setNbt(nbt) // Update the block's Nbt
    debug("Replanted '" + crop.name + "' at " + block.pos + ".")
    return(true) // Did break the crop
}

function useItemOn(player, tool, block) { // Player right clicked a block
    let crop = crops.get(block.name.substring(10)) // Store the crop info
    let item = items.get(block.name.substring(10)) // Store the item usage info
    let state = block.getNbt().getTag("states") // Store the block state
    if (crop == null) { // The block doesn't exist within the crops definition
        return // Quit the function
    }
    else if (!crop.enabled) { // Auto harvest is disabled for this crop
        debug("Auto harvest is disabled for '" + crop.name + "'!")
        return // Quit the function
    }
    else if (item.unusableItems.includes(tool.type.substring(10)) || (!item.canUseItems.includes(tool.type.substring(10)) && !item.canUseItems.length == 0) || (!item.canHarvestUsingSelf && crops.get(tool.type.substring(10)) != null && crops.get(tool.type.substring(10)).name == crop.name)) { // User didn't use a valid item
        debug(player.name + ", you can't auto-harvest using '" + tool.name + "'!")
        return // Quit the function
    }
    else if (crop.growth > state.getTag("growth") || crop.growth > state.getTag("age")) { // Crop isn't fully grown
        debug("'" + crop.name + "' isn't fully grown at " + block.pos)
        return // Quit the function
    }
    let origins = [block.pos] // Store all connected blocks
    let targets = [] // Store all target blocks
    let count = 0 // Count all harvested blocks
    for (let i=0; i<origins.length; i++) { // Go through each position in the list
        for (let relPos of crop.harvest) { // Check each position, relative to crop (NESW to the crop)
            let target_block = mc.getBlock(origins[i].x + relPos.x, origins[i].y + relPos.y, origins[i].z + relPos.z, origins[i].dimid) // Store the target block
            if (includes(targets, target_block.pos)) { // The block was harvested, or didn't need to be
                continue // Skip this block
            }
            if (target_block.name == "minecraft:" + crop.name && mc.getBlock(origins[i]).name == "minecraft:" + crop.origin) { // Found connected target
                targets.push(target_block.pos) // Add to list of checked targets
                if (breakCrop(crop, target_block)) { // Harvested the crop
                    count ++ // Increase the counter
                }
            }
            if (target_block.name == "minecraft:" + crop.origin && !includes(origins, target_block.pos)) { // Found connected origin block
                origins.push(target_block.pos) // Add to list of connected blocks to be checked 
            }
        }
    }
    if (count > 0) { // Crops were harvested
        debug(player.name + " harvested " + count + " of '" + crop.name + "' connected to '" + crop.origin + "'.");
    }
}

function initializeListeners() {
    mc.listen("onUseItemOn", useItemOn) // Listen for players to right click a block
}

function initializeConfigs() {
    let CROP_CONFIG = {
        "wheat": {
            "enabled": true,
            "name": "wheat",
            "origin": "wheat",
            "replant": true,
            "growth": 7,
            "harvest": [{ "x": 0, "y": 0, "z": 0}, { "x": 1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": 1 }, { "x": -1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": -1 } ]
        },
        "carrots": {
            "enabled": true,
            "name": "carrots",
            "origin": "carrots",
            "replant": true,
            "growth": 7,
            "harvest": [ { "x": 0, "y": 0, "z": 0 } ]
        },
        "potatoes": {
            "enabled": true,
            "name": "potatoes",
            "origin": "potatoes",
            "replant": true,
            "growth": 7,
            "harvest": [ { "x": 0, "y": 0, "z": 0 } ]
        },
        "beetroot": {
            "enabled": true,
            "name": "beetroot",
            "origin": "beetroot",
            "replant": true,
            "growth": 7,
            "harvest": [ { "x": 0, "y": 0, "z": 0 } ]
        },
        "pumpkin": {
            "enabled": true,
            "name": "pumpkin",
            "origin": "pumpkin_stem",
            "replant": false,
            "growth": 7,
            "harvest": [ { "x": 1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": 1 }, { "x": -1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": -1 } ]
        },
        "melon_block": {
            "enabled": true,
            "name": "melon_block",
            "origin": "melon_stem",
            "replant": false,
            "growth": 7,
            "harvest": [ { "x": 1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": 1 }, { "x": -1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": -1 } ]
        },
        "cocoa": {
            "enabled": true,
            "name": "cocoa",
            "origin": "cocoa",
            "replant": true,
            "growth": 2,
            "harvest": [ { "x": 0, "y": 0, "z": 0 } ]
        },
        "nether_wart": {
            "enabled": true,
            "name": "nether_wart",
            "origin": "nether_wart",
            "replant": true,
            "growth": 3,
            "harvest": [ { "x": 0, "y": 0, "z": 0 } ]
        },
        "cactus": {
            "enabled": true,
            "name": "cactus",
            "origin": "cactus",
            "replant": false,
            "growth": null,
            "harvest": [ { "x": 0, "y": 1, "z": 0 } ]
        },
        "sugar_cane": {
            "enabled": true,
            "name": "reeds",
            "origin": "reeds",
            "replant": false,
            "growth": null,
            "harvest": [ { "x": 0, "y": 1, "z": 0 } ]
        },
        "bamboo": {
            "enabled": true,
            "name": "bamboo",
            "origin": "bamboo",
            "replant": false,
            "growth": null,
            "harvest": [ { "x": 0, "y": 1, "z": 0 } ]
        },
        "kelp": {
            "enabled": true,
            "name": "kelp",
            "origin": "kelp",
            "replant": false,
            "growth": null,
            "harvest": [ { "x": 0, "y": 1, "z": 0 } ]
        },
        "chorus_plant": {
            "enabled": true,
            "name": "chorus_plant",
            "origin": "chorus_plant",
            "replant": false,
            "growth": null,
            "harvest": [ { "x": 0, "y": 1, "z": 0 }, { "x": 1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": 1 }, { "x": -1, "y": 0, "z": 0 }, { "x": 0, "y": 0, "z": -1 } ]
        }
    }
    CROP_CONFIG["pumpkin_stem"] = CROP_CONFIG["pumpkin"] // Point 'pumpkin_stem' to the 'pumpkin' object
    CROP_CONFIG["melon_stem"] = CROP_CONFIG["melon_block"] // Point 'melon_stem' to the 'melon_block' object
    CROP_CONFIG["melon_seeds"] = CROP_CONFIG["melon_block"] // Point 'melon_seeds' to the 'melon_block' object
    CROP_CONFIG["pumpkin_seeds"] = CROP_CONFIG["pumpkin"] // Point 'pumpkin_seeds' to the 'pumpkin' object
    CROP_CONFIG["beetroot_seeds"] = CROP_CONFIG["beetroot"] // Point 'beetroot_seeds' to the 'beetroot' object
    CROP_CONFIG["cocoa_beans"] = CROP_CONFIG["cocoa"] // Point 'cocoa_beans' to the 'cocoa' object
    CROP_CONFIG["seeds"] = CROP_CONFIG["wheat"] // Point 'seeds' to the 'wheat' object
    CROP_CONFIG["carrot"] = CROP_CONFIG["carrots"] // Point 'carrot' to the 'carrots' object
    CROP_CONFIG["potato"] = CROP_CONFIG["potatoes"] // Point 'potato' to the 'potatoes' object
    CROP_CONFIG["reeds"] = CROP_CONFIG["sugar_cane"] // Point 'reeds' to the 'sugar_cane' object
    let ITEM_CONFIG = {} // Store crop settings per each item
    for (var property in CROP_CONFIG) { // Go through each crop in the config
        if (Object.prototype.hasOwnProperty.call(CROP_CONFIG, property)) { // Is a valid crop
            ITEM_CONFIG[property] = { // Set the crop item settings
                canUseItems: [], // Items that can harvest with
                unusableItems: [], // Items that can't harvest with
                canHarvestUsingSelf: false // Crops can't be harvested while holding the same crop
            }
        }
    }
    let CONFIG = { // Store plugin settings
        "debug": false,
        "farmland": {
            "alwaysFertile": false,
            "noFallDamage": false,
        }
    }
    crops = new JsonConfigFile("plugins/LLCropProtect/crops.json", JSON.stringify(CROP_CONFIG)) // Import the crops configuration
    items = new JsonConfigFile("plugins/LLCropProtect/items.json", JSON.stringify(ITEM_CONFIG)) // Import the items configuration
    config = new JsonConfigFile("plugins/LLCropProtect/config.json", JSON.stringify(CONFIG)) // Import the plugin configuration
}
