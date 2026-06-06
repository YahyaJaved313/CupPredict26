import math
import random
import json

def poisson_random(lmbda):
    """
    Generates a random integer following a Poisson distribution with mean lmbda.
    Knuth's method for generating Poisson random variables.
    """
    if lmbda <= 0:
        return 0
    L = math.exp(-lmbda)
    k = 0
    p = 1.0
    while p > L:
        k += 1
        p *= random.random()
    return k - 1

def simulate_match(team1, team2, host_boost=False, is_knockout=False):
    """
    Simulates a match between team1 and team2 using the Poisson distribution.
    Ratings are scaled from 0-100.
    """
    # Base parameters
    t1_att = team1['attack']
    t1_def = team1['defense']
    t2_att = team2['attack']
    t2_def = team2['defense']
    
    # Host boost: USA, CAN, MEX get a small performance boost if enabled
    hosts = ["USA", "CAN", "MEX"]
    if host_boost:
        if team1['code'] in hosts:
            t1_att += 5
            t1_def += 5
        if team2['code'] in hosts:
            t2_att += 5
            t2_def += 5
            
    # Convert 0-100 ratings to Poisson multipliers
    # Att range: 0.35 to 1.80 (average ~ 1.075)
    t1_att_mult = 0.35 + (t1_att / 100.0) * 1.45
    t2_att_mult = 0.35 + (t2_att / 100.0) * 1.45
    
    # Def range: 1.65 down to 0.30 (lower is better, meaning opponent scores less, average ~ 0.975)
    t1_def_mult = 1.65 - (t1_def / 100.0) * 1.35
    t2_def_mult = 1.65 - (t2_def / 100.0) * 1.35
    
    # Expected goals (average goals per team per match in World Cups is ~1.35)
    lambda1 = t1_att_mult * t2_def_mult * 1.35
    lambda2 = t2_att_mult * t1_def_mult * 1.35
    
    goals1 = poisson_random(lambda1)
    goals2 = poisson_random(lambda2)
    
    result = {
        "team1": team1["name"],
        "code1": team1["code"],
        "team2": team2["name"],
        "code2": team2["code"],
        "goals1": goals1,
        "goals2": goals2,
        "is_knockout": is_knockout,
        "tied": goals1 == goals2,
        "shootout": False,
        "shootout_score1": 0,
        "shootout_score2": 0,
        "winner_code": None
    }
    
    if goals1 > goals2:
        result["winner_code"] = team1["code"]
    elif goals2 > goals1:
        result["winner_code"] = team2["code"]
    elif is_knockout:
        # Simulate penalty shootout
        # Base penalty success rate is 75%, adjusted slightly by overall team skill gap
        t1_overall = (t1_att + t1_def) / 2.0
        t2_overall = (t2_att + t2_def) / 2.0
        
        p1 = 0.75 + (t1_overall - t2_overall) / 1000.0
        p1 = max(0.55, min(0.90, p1))
        
        p2 = 0.75 + (t2_overall - t1_overall) / 1000.0
        p2 = max(0.55, min(0.90, p2))
        
        # Shootout simulation
        so1, so2 = 0, 0
        # First 5 penalties
        for _ in range(5):
            if random.random() < p1:
                so1 += 1
            if random.random() < p2:
                so2 += 1
        
        # Sudden death if tied
        while so1 == so2:
            s1 = 1 if random.random() < p1 else 0
            s2 = 1 if random.random() < p2 else 0
            so1 += s1
            so2 += s2
            
        result["shootout"] = True
        result["shootout_score1"] = so1
        result["shootout_score2"] = so2
        result["winner_code"] = team1["code"] if so1 > so2 else team2["code"]
        
    return result

class TournamentSimulator:
    def __init__(self, teams):
        self.teams = {t["code"]: t for t in teams}
        
    def run_group_stage(self, host_boost=False):
        # Initialize group standings data
        standings = {}
        for code, team in self.teams.items():
            grp = team["group"]
            if grp not in standings:
                standings[grp] = {}
            standings[grp][code] = {
                "name": team["name"],
                "code": code,
                "points": 0,
                "played": 0,
                "wins": 0,
                "draws": 0,
                "losses": 0,
                "goals_for": 0,
                "goals_against": 0,
                "goal_diff": 0,
                "rank": team["rank"]
            }
            
        # Group matches
        groups = {}
        for code, team in self.teams.items():
            grp = team["group"]
            if grp not in groups:
                groups[grp] = []
            groups[grp].append(team)
            
        matches_played = []
        
        for grp, grp_teams in groups.items():
            # Round-robin for each group of 4 (6 matches total per group)
            for i in range(len(grp_teams)):
                for j in range(i + 1, len(grp_teams)):
                    t1 = grp_teams[i]
                    t2 = grp_teams[j]
                    
                    res = simulate_match(t1, t2, host_boost=host_boost, is_knockout=False)
                    matches_played.append(res)
                    
                    # Update stats for team 1
                    s1 = standings[grp][t1["code"]]
                    s1["played"] += 1
                    s1["goals_for"] += res["goals1"]
                    s1["goals_against"] += res["goals2"]
                    s1["goal_diff"] = s1["goals_for"] - s1["goals_against"]
                    
                    # Update stats for team 2
                    s2 = standings[grp][t2["code"]]
                    s2["played"] += 1
                    s2["goals_for"] += res["goals2"]
                    s2["goals_against"] += res["goals1"]
                    s2["goal_diff"] = s2["goals_for"] - s2["goals_against"]
                    
                    if res["goals1"] > res["goals2"]:
                        s1["points"] += 3
                        s1["wins"] += 1
                        s2["losses"] += 1
                    elif res["goals2"] > res["goals1"]:
                        s2["points"] += 3
                        s2["wins"] += 1
                        s1["losses"] += 1
                    else:
                        s1["points"] += 1
                        s2["points"] += 1
                        s1["draws"] += 1
                        s2["draws"] += 1
                        
        # Sort standings for each group
        sorted_standings = {}
        for grp, grp_standings in standings.items():
            # Tie breakers: Points desc, Goal Diff desc, Goals For desc, FIFA rank asc
            sorted_teams = sorted(
                grp_standings.values(),
                key=lambda x: (x["points"], x["goal_diff"], x["goals_for"], -x["rank"]),
                reverse=True
            )
            sorted_standings[grp] = sorted_teams
            
        # Select best 3rd-place teams (need 8 out of 12)
        third_place_teams = []
        for grp, sorted_list in sorted_standings.items():
            # The 3rd place team is index 2
            third_place_teams.append(sorted_list[2])
            
        # Sort third-place teams across all groups
        sorted_third_places = sorted(
            third_place_teams,
            key=lambda x: (x["points"], x["goal_diff"], x["goals_for"], -x["rank"]),
            reverse=True
        )
        
        advancing_third_places = sorted_third_places[:8]
        advancing_third_codes = [t["code"] for t in advancing_third_places]
        
        # Compile list of all advancing teams (24 from top 2 + 8 from 3rd-place)
        # We will categorize them to build the R32 bracket
        winners = {grp: sorted_list[0] for grp, sorted_list in sorted_standings.items()}
        runners = {grp: sorted_list[1] for grp, sorted_list in sorted_standings.items()}
        thirds = advancing_third_places # already sorted top 8
        
        return {
            "standings": sorted_standings,
            "matches": matches_played,
            "third_places_all": sorted_third_places,
            "advancing_third_codes": advancing_third_codes,
            "winners": winners,
            "runners": runners,
            "thirds": thirds
        }

    def run_knockout_stage(self, group_stage_results, host_boost=False):
        winners = group_stage_results["winners"]
        runners = group_stage_results["runners"]
        thirds = group_stage_results["thirds"] # top 8 third place teams
        
        # Map 3rd-place teams to keys T1 to T8
        t_teams = {f"T{i+1}": thirds[i] for i in range(len(thirds))}
        
        # Round of 32 setup based on our deterministic bracket slots
        # Slot definitions matching W (Winner), R (Runner-up), T (3rd-place)
        r32_pairings = [
            ("W_A", t_teams.get("T1")),
            ("R_B", "R_C"),
            ("W_C", t_teams.get("T2")),
            ("W_D", "R_E"),
            ("W_E", t_teams.get("T3")),
            ("R_F", "R_G"),
            ("W_G", t_teams.get("T4")),
            ("W_H", "R_I"),
            ("W_I", t_teams.get("T5")),
            ("R_J", "R_K"),
            ("W_K", t_teams.get("T6")),
            ("W_L", "R_A"),
            ("W_B", t_teams.get("T7")),
            ("W_F", "R_D"),
            ("W_J", t_teams.get("T8")),
            ("R_H", "R_L")
        ]
        
        # Helper to resolve team dict
        def resolve(ref):
            if ref is None:
                # Fallback in case less than 8 third-place teams (shouldn't happen)
                # Just pick a random team that didn't advance or default
                return list(self.teams.values())[0]
            if isinstance(ref, dict):
                return self.teams[ref["code"]]
            
            # Formats like W_A or R_B
            type_char, grp = ref.split("_")
            if type_char == "W":
                return self.teams[winners[grp]["code"]]
            elif type_char == "R":
                return self.teams[runners[grp]["code"]]
            return self.teams[ref]
            
        r32_matches = []
        r32_winners = []
        
        # Simulate Round of 32
        for pair in r32_pairings:
            team1 = resolve(pair[0])
            team2 = resolve(pair[1])
            res = simulate_match(team1, team2, host_boost=host_boost, is_knockout=True)
            r32_matches.append(res)
            r32_winners.append(self.teams[res["winner_code"]])
            
        # Round of 16 (16 teams -> 8 matches)
        r16_matches = []
        r16_winners = []
        for i in range(0, 16, 2):
            res = simulate_match(r32_winners[i], r32_winners[i+1], host_boost=host_boost, is_knockout=True)
            r16_matches.append(res)
            r16_winners.append(self.teams[res["winner_code"]])
            
        # Quarterfinals (8 teams -> 4 matches)
        qf_matches = []
        qf_winners = []
        for i in range(0, 8, 2):
            res = simulate_match(r16_winners[i], r16_winners[i+1], host_boost=host_boost, is_knockout=True)
            qf_matches.append(res)
            qf_winners.append(self.teams[res["winner_code"]])
            
        # Semifinals (4 teams -> 2 matches)
        sf_matches = []
        sf_winners = []
        sf_losers = []
        for i in range(0, 4, 2):
            res = simulate_match(qf_winners[i], qf_winners[i+1], host_boost=host_boost, is_knockout=True)
            sf_matches.append(res)
            sf_winners.append(self.teams[res["winner_code"]])
            # Find the loser
            loser_code = res["code2"] if res["winner_code"] == res["code1"] else res["code1"]
            sf_losers.append(self.teams[loser_code])
            
        # 3rd Place Match (2 teams)
        third_place_match = simulate_match(sf_losers[0], sf_losers[1], host_boost=host_boost, is_knockout=True)
        third_place_winner = self.teams[third_place_match["winner_code"]]
        
        # Final Match (2 teams)
        final_match = simulate_match(sf_winners[0], sf_winners[1], host_boost=host_boost, is_knockout=True)
        champion = self.teams[final_match["winner_code"]]
        
        return {
            "r32": r32_matches,
            "r16": r16_matches,
            "qf": qf_matches,
            "sf": sf_matches,
            "third_place": third_place_match,
            "final": final_match,
            "champion": champion,
            "third_place_winner": third_place_winner
        }

    def simulate_tournament(self, host_boost=False):
        """Simulates a complete tournament once and returns the full bracket tree."""
        gs_results = self.run_group_stage(host_boost=host_boost)
        ko_results = self.run_knockout_stage(gs_results, host_boost=host_boost)
        
        return {
            "group_stage": {
                "standings": gs_results["standings"],
                "matches": gs_results["matches"],
                "third_places_all": gs_results["third_places_all"],
                "advancing_third_codes": gs_results["advancing_third_codes"]
            },
            "knockout": ko_results
        }
        
    def run_monte_carlo(self, simulations_count=1000, host_boost=False):
        """Runs the simulation multiple times and tabulates stats for each team."""
        stats = {code: {
            "code": code,
            "name": team["name"],
            "group": team["group"],
            "rank": team["rank"],
            "group_stage_exit": 0,
            "r32_exit": 0,
            "r16_exit": 0,
            "qf_exit": 0,
            "sf_exit": 0,
            "runner_up": 0,
            "third_place": 0,
            "champion": 0
        } for code, team in self.teams.items()}
        
        for _ in range(simulations_count):
            gs_results = self.run_group_stage(host_boost=host_boost)
            
            # Track who didn't advance from group stage
            # Collect all advancing team codes
            advancing = []
            for grp, sorted_list in gs_results["standings"].items():
                advancing.append(sorted_list[0]["code"])
                advancing.append(sorted_list[1]["code"])
            advancing.extend(gs_results["advancing_third_codes"])
            
            for code in stats.keys():
                if code not in advancing:
                    stats[code]["group_stage_exit"] += 1
                    
            # Run knockout stage
            ko = self.run_knockout_stage(gs_results, host_boost=host_boost)
            
            # R32 Exits
            r32_winners = [m["winner_code"] for m in ko["r32"]]
            for m in ko["r32"]:
                loser_code = m["code2"] if m["winner_code"] == m["code1"] else m["code1"]
                stats[loser_code]["r32_exit"] += 1
                
            # R16 Exits
            r16_winners = [m["winner_code"] for m in ko["r16"]]
            for m in ko["r16"]:
                loser_code = m["code2"] if m["winner_code"] == m["code1"] else m["code1"]
                stats[loser_code]["r16_exit"] += 1
                
            # QF Exits
            qf_winners = [m["winner_code"] for m in ko["qf"]]
            for m in ko["qf"]:
                loser_code = m["code2"] if m["winner_code"] == m["code1"] else m["code1"]
                stats[loser_code]["qf_exit"] += 1
                
            # SF Exits (decided by 3rd place match)
            # Loser of 3rd place match is 4th overall (sf_exit)
            # Winner of 3rd place match is third_place
            tp_match = ko["third_place"]
            tp_winner = ko["third_place_winner"]["code"]
            tp_loser = tp_match["code2"] if tp_winner == tp_match["code1"] else tp_match["code1"]
            stats[tp_loser]["sf_exit"] += 1
            stats[tp_winner]["third_place"] += 1
            
            # Runner up
            final_match = ko["final"]
            champion_code = ko["champion"]["code"]
            runner_up_code = final_match["code2"] if champion_code == final_match["code1"] else final_match["code1"]
            stats[runner_up_code]["runner_up"] += 1
            stats[champion_code]["champion"] += 1
            
        # Convert counts to percentages
        for code, team_stats in stats.items():
            for key in ["group_stage_exit", "r32_exit", "r16_exit", "qf_exit", "sf_exit", "runner_up", "third_place", "champion"]:
                team_stats[key] = round((team_stats[key] / simulations_count) * 100.0, 2)
                
        # Return sorted by champion probability desc
        sorted_stats = sorted(stats.values(), key=lambda x: x["champion"], reverse=True)
        return sorted_stats
