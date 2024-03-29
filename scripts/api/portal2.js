const Portal2MapType = {
    Unknown: 0,
    SinglePlayer: 1,
    Cooperative: 2,
    Extras: 3,
    WorkshopSinglePlayer: 4,
    WorkshopCooperative: 5,
    Custom: 6,
};

class Portal2Map {
    get isOfficial() {
        return (
            (this.type === Portal2MapType.SinglePlayer || this.type === Portal2MapType.Cooperative) &&
            this.bestTimeId !== null &&
            this.bestPortalsId !== null
        );
    }

    get exists() {
        return (
            (this.type === Portal2MapType.SinglePlayer || this.type == Portal2MapType.Cooperative) &&
            this.bestTimeId !== null
        );
    }

    get url() {
        return `https://board.portal2.sr/chamber/${this.bestTimeId}`;
    }
    get imageUrl() {
        return `https://board.portal2.sr/images/chambers/${this.bestTimeId}.jpg"`;
    }
    get imageFullUrl() {
        return `https://board.portal2.sr/images/chambers_full/${this.bestTimeId}.jpg"`;
    }
    get bestTimeSteamUrl() {
        return `https://steamcommunity.com/stats/Portal2/leaderboards/${this.bestTimeId}`;
    }
    get bestPortalsSteamUrl() {
        return `https://steamcommunity.com/stats/Portal2/leaderboards/${this.bestPortalsId}`;
    }

    constructor(name, alias, type, bestTimeId, bestPortalsId, chapterId) {
        this.name = name;
        this.alias = alias;
        this.type = type;
        this.bestTimeId = bestTimeId;
        this.bestPortalsId = bestPortalsId;
        this.chapterId = chapterId;
    }

    static searchByName(name) {
        return CampaignMaps.find((map) => map.name.localeCompare(name));
    }
    static searchById(id) {
        return CampaignMaps.find((map) => map.bestTimeId === id || map.bestPortalsId == id);
    }
    static singlePlayerMaps() {
        return CampaignMaps.filter((map) => map.type === Portal2MapType.SinglePlayer);
    }
    static cooperativeMaps() {
        return CampaignMaps.filter((map) => map.type === Portal2MapType.Cooperative);
    }
}

const CampaignMaps = [
    new Portal2Map('sp_a1_intro1', 'Container Ride', Portal2MapType.SinglePlayer, 62761, null, 7),
    new Portal2Map('sp_a1_intro2', 'Portal Carousel', Portal2MapType.SinglePlayer, 62758, null, 7),
    new Portal2Map('sp_a1_intro3', 'Portal Gun', Portal2MapType.SinglePlayer, 47458, 47459, 7),
    new Portal2Map('sp_a1_intro4', 'Smooth Jazz', Portal2MapType.SinglePlayer, 47455, 47454, 7),
    new Portal2Map('sp_a1_intro5', 'Cube Momentum', Portal2MapType.SinglePlayer, 47452, 47451, 7),
    new Portal2Map('sp_a1_intro6', 'Future Starter', Portal2MapType.SinglePlayer, 47106, 47107, 7),
    new Portal2Map('sp_a1_intro7', 'Secret Panel', Portal2MapType.SinglePlayer, 62763, null, 7),
    new Portal2Map('sp_a1_wakeup', 'Wakeup', Portal2MapType.SinglePlayer, 62759, null, 7),
    new Portal2Map('sp_a2_intro', 'Incinerator', Portal2MapType.SinglePlayer, 47735, 47734, 7),
    new Portal2Map('sp_a2_laser_intro', 'Laser Intro', Portal2MapType.SinglePlayer, 62765, null, 8),
    new Portal2Map('sp_a2_laser_stairs', 'Laser Stairs', Portal2MapType.SinglePlayer, 47736, 47737, 8),
    new Portal2Map('sp_a2_dual_lasers', 'Dual Lasers', Portal2MapType.SinglePlayer, 47738, 47739, 8),
    new Portal2Map('sp_a2_laser_over_goo', 'Laser Over Goo', Portal2MapType.SinglePlayer, 47742, 47743, 8),
    new Portal2Map('sp_a2_catapult_intro', 'Catapult Intro', Portal2MapType.SinglePlayer, 62767, null, 8),
    new Portal2Map('sp_a2_trust_fling', 'Trust Fling', Portal2MapType.SinglePlayer, 47744, 47745, 8),
    new Portal2Map('sp_a2_pit_flings', 'Pit Flings', Portal2MapType.SinglePlayer, 47465, 47466, 8),
    new Portal2Map('sp_a2_fizzler_intro', 'Fizzler Intro', Portal2MapType.SinglePlayer, 47746, 47747, 8),
    new Portal2Map('sp_a2_sphere_peek', 'Ceiling Catapult', Portal2MapType.SinglePlayer, 47748, 47749, 9),
    new Portal2Map('sp_a2_ricochet', 'Ricochet', Portal2MapType.SinglePlayer, 47751, 47750, 9),
    new Portal2Map('sp_a2_bridge_intro', 'Bridge Intro', Portal2MapType.SinglePlayer, 47752, 47753, 9),
    new Portal2Map('sp_a2_bridge_the_gap', 'Bridge the Gap', Portal2MapType.SinglePlayer, 47755, 47754, 9),
    new Portal2Map('sp_a2_turret_intro', 'Turret Intro', Portal2MapType.SinglePlayer, 47756, 47757, 9),
    new Portal2Map('sp_a2_laser_relays', 'Laser Relays', Portal2MapType.SinglePlayer, 47759, 47758, 9),
    new Portal2Map('sp_a2_turret_blocker', 'Turret Blocker', Portal2MapType.SinglePlayer, 47760, 47761, 9),
    new Portal2Map('sp_a2_laser_vs_turret', 'Laser vs Turret', Portal2MapType.SinglePlayer, 47763, 47762, 9),
    new Portal2Map('sp_a2_pull_the_rug', 'Pull the Rug', Portal2MapType.SinglePlayer, 47764, 47765, 9),
    new Portal2Map('sp_a2_column_blocker', 'Column Blocker', Portal2MapType.SinglePlayer, 47766, 47767, 10),
    new Portal2Map('sp_a2_laser_chaining', 'Laser Chaining', Portal2MapType.SinglePlayer, 47768, 47769, 10),
    new Portal2Map('sp_a2_triple_laser', 'Triple Laser', Portal2MapType.SinglePlayer, 47770, 47771, 10),
    new Portal2Map('sp_a2_bts1', 'Jail Break', Portal2MapType.SinglePlayer, 47773, 47772, 10),
    new Portal2Map('sp_a2_bts2', 'Escape', Portal2MapType.SinglePlayer, 47774, 47775, 10),
    new Portal2Map('sp_a2_bts3', 'Turret Factory', Portal2MapType.SinglePlayer, 47776, 47777, 11),
    new Portal2Map('sp_a2_bts4', 'Turret Sabotage', Portal2MapType.SinglePlayer, 47779, 47778, 11),
    new Portal2Map('sp_a2_bts5', 'Neurotoxin Sabotage', Portal2MapType.SinglePlayer, 47780, 47781, 11),
    new Portal2Map('sp_a2_bts6', 'Tube Ride', Portal2MapType.SinglePlayer, null, null, 11),
    new Portal2Map('sp_a2_core', 'Core', Portal2MapType.SinglePlayer, 62771, null, 11),
    new Portal2Map('sp_a3_00', 'Long Fall', Portal2MapType.SinglePlayer, null, null, 12),
    new Portal2Map('sp_a3_01', 'Underground', Portal2MapType.SinglePlayer, 47783, 47782, 12),
    new Portal2Map('sp_a3_03', 'Cave Johnson', Portal2MapType.SinglePlayer, 47784, 47785, 12),
    new Portal2Map('sp_a3_jump_intro', 'Repulsion Intro', Portal2MapType.SinglePlayer, 47787, 47786, 12),
    new Portal2Map('sp_a3_bomb_flings', 'Bomb Flings', Portal2MapType.SinglePlayer, 47468, 47467, 12),
    new Portal2Map('sp_a3_crazy_box', 'Crazy Box', Portal2MapType.SinglePlayer, 47469, 47470, 12),
    new Portal2Map('sp_a3_transition01', 'PotatOS', Portal2MapType.SinglePlayer, 47472, 47471, 12),
    new Portal2Map('sp_a3_speed_ramp', 'Propulsion Intro', Portal2MapType.SinglePlayer, 47791, 47792, 13),
    new Portal2Map('sp_a3_speed_flings', 'Propulsion Flings', Portal2MapType.SinglePlayer, 47793, 47794, 13),
    new Portal2Map('sp_a3_portal_intro', 'Conversion Intro', Portal2MapType.SinglePlayer, 47795, 47796, 13),
    new Portal2Map('sp_a3_end', 'Three Gels', Portal2MapType.SinglePlayer, 47798, 47799, 13),
    new Portal2Map('sp_a4_intro', 'Test', Portal2MapType.SinglePlayer, 88350, null, 14),
    new Portal2Map('sp_a4_tb_intro', 'Funnel Intro', Portal2MapType.SinglePlayer, 47800, 47801, 14),
    new Portal2Map('sp_a4_tb_trust_drop', 'Ceiling Button', Portal2MapType.SinglePlayer, 47802, 47803, 14),
    new Portal2Map('sp_a4_tb_wall_button', 'Wall Button', Portal2MapType.SinglePlayer, 47804, 47805, 14),
    new Portal2Map('sp_a4_tb_polarity', 'Polarity', Portal2MapType.SinglePlayer, 47806, 47807, 14),
    new Portal2Map('sp_a4_tb_catch', 'Funnel Catch', Portal2MapType.SinglePlayer, 47808, 47809, 14),
    new Portal2Map('sp_a4_stop_the_box', 'Stop the Box', Portal2MapType.SinglePlayer, 47811, 47812, 14),
    new Portal2Map('sp_a4_laser_catapult', 'Laser Catapult', Portal2MapType.SinglePlayer, 47813, 47814, 14),
    new Portal2Map('sp_a4_laser_platform', 'Laser Platform', Portal2MapType.SinglePlayer, 47815, 47816, 14),
    new Portal2Map('sp_a4_speed_tb_catch', 'Propulsion Catch', Portal2MapType.SinglePlayer, 47817, 47818, 14),
    new Portal2Map('sp_a4_jump_polarity', 'Repulsion Polarity', Portal2MapType.SinglePlayer, 47819, 47820, 14),
    new Portal2Map('sp_a4_finale1', 'Finale 1', Portal2MapType.SinglePlayer, 62776, null, 15),
    new Portal2Map('sp_a4_finale2', 'Finale 2', Portal2MapType.SinglePlayer, 47821, 47822, 15),
    new Portal2Map('sp_a4_finale3', 'Finale 3', Portal2MapType.SinglePlayer, 47824, 47823, 15),
    new Portal2Map('sp_a4_finale4', 'Finale 4', Portal2MapType.SinglePlayer, 47456, 47457, 15),
    new Portal2Map('mp_coop_start', 'Start', Portal2MapType.Cooperative, null, null, 0),
    new Portal2Map('mp_coop_lobby_2', 'Lobby', Portal2MapType.Cooperative, null, null, 0),
    new Portal2Map('mp_coop_doors', 'Doors', Portal2MapType.Cooperative, 47741, 47740, 1),
    new Portal2Map('mp_coop_race_2', 'Buttons', Portal2MapType.Cooperative, 47825, 47826, 1),
    new Portal2Map('mp_coop_laser_2', 'Lasers', Portal2MapType.Cooperative, 47828, 47827, 1),
    new Portal2Map('mp_coop_rat_maze', 'Rat Maze', Portal2MapType.Cooperative, 47829, 47830, 1),
    new Portal2Map('mp_coop_laser_crusher', 'Laser Crusher', Portal2MapType.Cooperative, 45467, 45466, 1),
    new Portal2Map('mp_coop_teambts', 'Behind The Scenes', Portal2MapType.Cooperative, 46362, 46361, 1),
    new Portal2Map('mp_coop_fling_3', 'Flings', Portal2MapType.Cooperative, 47831, 47832, 2),
    new Portal2Map('mp_coop_infinifling_train', 'Infinifling', Portal2MapType.Cooperative, 47833, 47834, 2),
    new Portal2Map('mp_coop_come_along', 'Team Retrieval', Portal2MapType.Cooperative, 47835, 47836, 2),
    new Portal2Map('mp_coop_fling_1', 'Vertical Flings', Portal2MapType.Cooperative, 47837, 47838, 2),
    new Portal2Map('mp_coop_catapult_1', 'Catapults', Portal2MapType.Cooperative, 47840, 47839, 2),
    new Portal2Map('mp_coop_multifling_1', 'Multifling', Portal2MapType.Cooperative, 47841, 47842, 2),
    new Portal2Map('mp_coop_fling_crushers', 'Fling Crushers', Portal2MapType.Cooperative, 47844, 47843, 2),
    new Portal2Map('mp_coop_fan', 'Industrial Fan', Portal2MapType.Cooperative, 47845, 47846, 2),
    new Portal2Map('mp_coop_wall_intro', 'Cooperative Bridges', Portal2MapType.Cooperative, 47848, 47847, 3),
    new Portal2Map('mp_coop_wall_2', 'Bridge Swap', Portal2MapType.Cooperative, 47849, 47850, 3),
    new Portal2Map('mp_coop_catapult_wall_intro', 'Fling Block', Portal2MapType.Cooperative, 47854, 47855, 3),
    new Portal2Map('mp_coop_wall_block', 'Catapult Block', Portal2MapType.Cooperative, 47856, 47857, 3),
    new Portal2Map('mp_coop_catapult_2', 'Bridge Fling', Portal2MapType.Cooperative, 47858, 47859, 3),
    new Portal2Map('mp_coop_turret_walls', 'Turret Walls', Portal2MapType.Cooperative, 47861, 47860, 3),
    new Portal2Map('mp_coop_turret_ball', 'Turret Assassin', Portal2MapType.Cooperative, 52642, 52641, 3),
    new Portal2Map('mp_coop_wall_5', 'Bridge Testing', Portal2MapType.Cooperative, 52660, 52659, 3),
    new Portal2Map('mp_coop_tbeam_redirect', 'Cooperative Funnels', Portal2MapType.Cooperative, 52662, 52661, 4),
    new Portal2Map('mp_coop_tbeam_drill', 'Funnel Drill', Portal2MapType.Cooperative, 52663, 52664, 4),
    new Portal2Map('mp_coop_tbeam_catch_grind_1', 'Funnel Catch', Portal2MapType.Cooperative, 52665, 52666, 4),
    new Portal2Map('mp_coop_tbeam_laser_1', 'Funnel Laser', Portal2MapType.Cooperative, 52667, 52668, 4),
    new Portal2Map('mp_coop_tbeam_polarity', 'Cooperative Polarity', Portal2MapType.Cooperative, 52671, 52672, 4),
    new Portal2Map('mp_coop_tbeam_polarity2', 'Funnel Hop', Portal2MapType.Cooperative, 52687, 52688, 4),
    new Portal2Map('mp_coop_tbeam_polarity3', 'Advanced Polarity', Portal2MapType.Cooperative, 52689, 52690, 4),
    new Portal2Map('mp_coop_tbeam_maze', 'Funnel Maze', Portal2MapType.Cooperative, 52691, 52692, 4),
    new Portal2Map('mp_coop_tbeam_end', 'Turret Warehouse', Portal2MapType.Cooperative, 52777, 52778, 4),
    new Portal2Map('mp_coop_paint_come_along', 'Repulsion Jumps', Portal2MapType.Cooperative, 52694, 52693, 5),
    new Portal2Map('mp_coop_paint_redirect', 'Double Bounce', Portal2MapType.Cooperative, 52711, 52712, 5),
    new Portal2Map('mp_coop_paint_bridge', 'Bridge Repulsion', Portal2MapType.Cooperative, 52714, 52713, 5),
    new Portal2Map('mp_coop_paint_walljumps', 'Wall Repulsion', Portal2MapType.Cooperative, 52715, 52716, 5),
    new Portal2Map('mp_coop_paint_speed_fling', 'Propulsion Crushers', Portal2MapType.Cooperative, 52717, 52718, 5),
    new Portal2Map('mp_coop_paint_red_racer', 'Turret Ninja', Portal2MapType.Cooperative, 52735, 52736, 5),
    new Portal2Map('mp_coop_paint_speed_catch', 'Propulsion Retrieval', Portal2MapType.Cooperative, 52738, 52737, 5),
    new Portal2Map('mp_coop_paint_longjump_intro', 'Vault Entrance', Portal2MapType.Cooperative, 52740, 52739, 5),
    new Portal2Map('mp_coop_separation_1', 'Separation', Portal2MapType.Cooperative, 49341, 49342, 6),
    new Portal2Map('mp_coop_tripleaxis', 'Triple Axis', Portal2MapType.Cooperative, 49343, 49344, 6),
    new Portal2Map('mp_coop_catapult_catch', 'Catapult Catch', Portal2MapType.Cooperative, 49345, 49346, 6),
    new Portal2Map('mp_coop_2paints_1bridge', 'Bridge Gels', Portal2MapType.Cooperative, 49347, 49348, 6),
    new Portal2Map('mp_coop_paint_conversion', 'Maintenance', Portal2MapType.Cooperative, 49349, 49350, 6),
    new Portal2Map('mp_coop_bridge_catch', 'Bridge Catch', Portal2MapType.Cooperative, 49351, 49352, 6),
    new Portal2Map('mp_coop_laser_tbeam', 'Double Lift', Portal2MapType.Cooperative, 52757, 52758, 6),
    new Portal2Map('mp_coop_paint_rat_maze', 'Gel Maze', Portal2MapType.Cooperative, 52759, 52760, 6),
    new Portal2Map('mp_coop_paint_crazy_box', 'Crazier Box', Portal2MapType.Cooperative, 48287, 48288, 6),
];

module.exports = {
    Portal2MapType,
    Portal2Map,
    CampaignMaps,
};
