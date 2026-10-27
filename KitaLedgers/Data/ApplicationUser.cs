using KitaLedgers.Models;
using Microsoft.AspNetCore.Identity;

namespace KitaLedgers.Data;

// Add profile data for application users by adding properties to the ApplicationUser class
public class ApplicationUser : IdentityUser
{
    public ICollection<Business> Businesses { get; set; }
        = new List<Business>();
}