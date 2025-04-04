// Function to load and display public profiles
async function loadPublicProfiles() {
    const profilesContainer = document.getElementById('public-profiles');
    profilesContainer.innerHTML = ''; // Clear existing profiles

    const querySnapshot = await getDocs(collection(db, "public_profiles"));

    querySnapshot.forEach(doc => {
        const data = doc.data();
        const profileCard = document.createElement('div');
        profileCard.classList.add('profile-card');
        profileCard.innerHTML = `
            <img src="${data.profilePhotoUrl || 'default-profile.png'}" alt="Profile Photo">
            <h4>${data.email}</h4>
            <p><strong>Skills:</strong> ${data.skills ? data.skills.join(", ") : "N/A"}</p>
            <p><strong>Contact:</strong> ${data.contactInfo || "N/A"}</p>
        `;
        profilesContainer.appendChild(profileCard);
    });
}

// Modify uploadResume function to include public profile creation
window.uploadResume = async () => {
    const file = document.getElementById('resume').files[0];
    const user = auth.currentUser;

    if (!user) {
        alert("You must be logged in.");
        return;
    }

    if (!file) {
        alert("Please select a resume file.");
        return;
    }

    const storageRef = ref(storage, `resumes/${user.uid}-${file.name}`);

    try {
        await uploadBytes(storageRef, file);
        const fileURL = await getDownloadURL(storageRef);

        const skills = document.getElementById('skills').value;
        const experience = document.getElementById('experience').value;
        const projects = document.getElementById('projects').value;
        const contactInfo = document.getElementById('contact').value;
        const profilePhoto = document.getElementById('profile-photo').files[0];

        let profilePhotoURL = null;
        if (profilePhoto) {
            const profilePhotoRef = ref(storage, `profilePhotos/${user.uid}-${profilePhoto.name}`);
            await uploadBytes(profilePhotoRef, profilePhoto);
            profilePhotoURL = await getDownloadURL(profilePhotoRef);
        }

        const userData = {
            userId: user.uid,
            email: user.email,
            resumeUrl: fileURL,
            skills: skills.split(",").map(skill => skill.trim()), // Trim spaces
            experience,
            projects,
            contactInfo,
            profilePhotoUrl: profilePhotoURL,
            uploadedAt: new Date()
        };

        // Save in Firestore (candidates collection)
        await setDoc(doc(db, "candidates", user.uid), userData, { merge: true });

        // Also save in public_profiles collection
        await setDoc(doc(db, "public_profiles", user.uid), userData, { merge: true });

        alert("Resume and profile uploaded successfully!");
        loadResumes(user);
        loadPublicProfiles(); // Refresh public profiles
    } catch (error) {
        alert("Upload error: " + error.message);
    }
};

// Load public profiles when the page loads
document.addEventListener("DOMContentLoaded", () => {
    loadPublicProfiles();
});

// Ensure onAuthStateChanged() is placed after this
onAuthStateChanged(auth, (user) => {
    if (user) {
        loadDashboard(user);
    } else {
        document.getElementById('auth').style.display = 'block';
        document.getElementById('candidate-dashboard').style.display = 'none';
        document.getElementById('employer-dashboard').style.display = 'none';
    }
});
